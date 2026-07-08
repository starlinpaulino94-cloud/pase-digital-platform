# Auditoría de Estabilidad — MembeGo

**Fecha:** 2026-07-08
**Alcance:** auditoría estática completa (arquitectura, base de datos, servidor, frontend, autenticación). Sin cambios de código.
**Síntoma reportado:** la app funciona al arrancar, se degrada tras varios minutos, los módulos (Mis Membresías, Oportunidades, Referidos, Promociones, Dashboard) fallan intermitentemente en todos los roles y luego se recuperan.

---

## 1. Diagnóstico raíz

El síntoma tiene **dos causas raíz independientes que se refuerzan entre sí**. Ambas son de infraestructura compartida, por eso afectan a todos los módulos y roles a la vez:

### Causa raíz nº 1 — Saturación de Supabase Auth + errores transitorios tratados como "sin sesión"

Cadena completa del fallo:

1. `getUser()` hace una **llamada de red** a Supabase (`GET /auth/v1/user`) y **no está memoizada** (no hay ni un solo `React.cache()` en `src/`). Cada render de página privada la ejecuta 4-5 veces: middleware + `requireRole` del layout + `getUnreadCount()` + `requireRole` de la página (+ `getClienteCompanies()` en el grupo cliente).
2. El middleware (`src/proxy.ts`) ejecuta `getUser()` **incondicionalmente en cada request** que pase el matcher — incluidas rutas públicas, `/api/health`, prefetches RSC y el túnel de Sentry (`/monitoring`).
3. El sidebar tiene 9-26 `<Link>` por rol **sin `prefetch={false}`** sobre rutas 100 % `force-dynamic` → cada render del shell dispara decenas de prefetches, y **cada prefetch atraviesa el middleware** = 1 llamada de red a Supabase.
4. Resultado medido en código: **~24-30 llamadas a Supabase Auth por click de un admin**; un usuario activo genera ~45-65/min; 10 usuarios ≈ 500-650/min → se alcanza el rate limit de Supabase Auth (429).
5. `getUser()` (`src/lib/auth/index.ts:6-10`) **descarta el objeto `error`**: ante un 429/timeout, supabase-js devuelve `user: null` sin lanzar → `requireUser` y el proxy interpretan "no autenticado" → **redirect a `/login`** aunque la sesión sea válida. Cuando la cuota se libera, todo "vuelve a funcionar".

Esto explica exactamente: "a veces cargan, a veces no, después vuelven a funcionar" + "pérdida de sesión" + "afecta a todos los roles".

### Causa raíz nº 2 — Agotamiento del pool de conexiones de PostgreSQL

1. `DATABASE_URL` usa el transaction pooler de Supabase (pgBouncer, puerto 6543) pero **sin `connection_limit` ni `pool_timeout`** → el pool interno de Prisma por instancia es `num_cpus × 2 + 1`.
2. Los dashboards disparan **ráfagas masivas de queries simultáneas**: `/admin/dashboard` = 16 queries en un solo `Promise.all`; `/superadmin/reportes` = **~7 queries × N empresas en paralelo (~150 con 20 empresas)**; `/superadmin/empresas` = 5×N.
3. Varias queries cargan **tablas enteras en memoria** solo para contar (todas las membresías activas, todas las visitas de 14 días, todos los ids de visitas de todas las empresas).
4. Con varias instancias serverless calientes + ráfagas concurrentes se supera el `default_pool_size` de pgBouncer → las queries encolan → expiran al `pool_timeout` de Prisma (10 s) → **errores P2024 intermitentes en todos los módulos** (comparten el mismo singleton) → al enfriarse las lambdas, se recupera.

### Descartado con evidencia

- ❌ Memory leaks del navegador: **cero** `setInterval`/polling/fetch de fondo en 131 componentes cliente. Un usuario inactivo genera 0 req/min.
- ❌ Sentry: sample rates correctos (traces 0.2, replays 0.1).
- ❌ Prisma en Edge runtime: no existe ninguna ruta `runtime = 'edge'`.
- ❌ Múltiples PrismaClient o GoTrueClient: hay un solo `new PrismaClient()` y `createBrowserClient` es singleton.
- ❌ Inyección SQL en `$queryRaw`: todos parametrizados.

---

## 2. Lista de problemas

Formato: **ID · Título · Prioridad · Impacto · Evidencia (archivo:línea) · Solución · Riesgo de la corrección · Estimación**

### 🔴 P0 — CRÍTICA (causas raíz del fallo intermitente)

| # | Problema | Impacto | Evidencia | Solución recomendada | Riesgo | Est. |
|---|----------|---------|-----------|----------------------|--------|------|
| **P0-1** | Error transitorio de Supabase (429/5xx) tratado como "sin sesión" → logout fantasma | Usuarios expulsados a /login con sesión válida; el patrón intermitente exacto | `src/lib/auth/index.ts:6-10` (descarta `error`); `src/proxy.ts:47-53` y `71-81` (fail-closed redirige) | Inspeccionar `error.status`: solo desloguear ante 401/`AuthSessionMissingError`; en 429/5xx no redirigir (reintento 1 vez o dejar pasar con la sesión de cookie) | Bajo | 2-3 h |
| **P0-2** | `getUser()` de red sin memoizar: 4-5 llamadas por página, ~24-30 por click con prefetch | Latencia acumulada (4×100-300 ms) + rate limit de Supabase Auth con pocos usuarios | `src/lib/auth/index.ts:4-8`; `src/proxy.ts:43-45`; `src/lib/auth/guards.ts:15-47`; 126 usos en 64 archivos; 0 usos de `cache()` | (a) Envolver `getUser` en `React.cache()` (dedup por request); (b) en el middleware validar el JWT localmente (`getClaims()`) en vez de llamada de red | Bajo (a) / Medio (b) | 3-5 h |
| **P0-3** | Los redirects del middleware descartan las cookies de sesión recién refrescadas | Refresh token rotado y perdido → "Invalid Refresh Token: Already Used" → sesión muerta aleatoria en todas las pestañas | `src/proxy.ts:48-52, 56-59, 64-69` (`NextResponse.redirect(url)` sin copiar `response.cookies`) | Al redirigir, copiar todas las cookies de `response` al redirect (patrón oficial Supabase) | Bajo | 1-2 h |
| **P0-4** | Prisma sin `connection_limit`/`pool_timeout` + ráfagas de 16-150 queries paralelas → agotamiento de pgBouncer | Timeouts P2024 intermitentes en TODOS los módulos; se recupera al enfriar lambdas | `src/lib/prisma.ts:7-13`; `.env.example:12-14`; `src/modules/admin/dashboardQueries.ts:57-123` (16 en un `Promise.all`); `src/modules/admin/queries.ts:188-194` (7×N) | Añadir `&connection_limit=1&pool_timeout=20` al `DATABASE_URL` en Vercel (verificar también `pgbouncer=true`); mantener singleton global también en producción; trocear los `Promise.all` gigantes | Bajo | 1-2 h + verificación |

### 🟠 P1 — ALTA (amplificadores directos)

| # | Problema | Impacto | Evidencia | Solución | Riesgo | Est. |
|---|----------|---------|-----------|----------|--------|------|
| **P1-1** | Matcher del middleware demasiado amplio + `getUser()` incondicional: rutas públicas, `/api/health`, `/api/cron`, sitemap y túnel Sentry (`/monitoring`) disparan auth de red | Multiplicador silencioso de cuota Auth (cada evento de telemetría del navegador = 1 llamada a Supabase) | `src/proxy.ts:43-45, 87-91`; `next.config.ts` (tunnelRoute `/monitoring`) | Ejecutar `getUser()` solo si la ruta está protegida o es /login; excluir `/monitoring`, `/api/health`, `/api/cron` del matcher | Bajo | 1-2 h |
| **P1-2** | Prefetch del sidebar sin control: 20 links (admin), 26 (superadmin), 9 (cliente) | Cada render del shell = decenas de requests por el middleware | `src/components/layout/nav-config.ts:41-190`; `AppSidebar.tsx:59` (sin `prefetch={false}`) | `prefetch={false}` en la nav (o resuelto de raíz por P1-1) | Bajo | 1 h |
| **P1-3** | `/superadmin/reportes`: N+1 de ~7 queries × empresa, cargando TODAS las membresías activas por empresa para contar en JS | ~150 queries paralelas por carga; demanda instantánea de todo el pool | `src/modules/admin/queries.ts:188-194` y `95-107` | Reescribir con `groupBy(['companyId','planId'])` — 5-6 queries totales | Medio | 4-6 h |
| **P1-4** | `/superadmin/empresas`: 5 queries por empresa | 100+ queries con 20 empresas | `src/modules/empresas/queries.ts:88-134` | 5 `groupBy(['companyId'])` globales + `_count` | Medio | 3-4 h |
| **P1-5** | `/superadmin/dashboard`: 2 counts por empresa + filtra por `cliente:{companyId}` ignorando el índice directo | 1+2N queries por carga | `src/app/(superadmin)/superadmin/dashboard/page.tsx:22-30` | 1 `membership.groupBy({by:['companyId','estado']})` | Bajo | 2 h |
| **P1-6** | `/admin/dashboard`: 16 queries en un `Promise.all` + 2 `findMany` sin límite (suma ingresos y agrupa visitas en JS) | Tormenta de conexiones por visita; crece con el negocio | `src/modules/admin/dashboardQueries.ts:57-123` (esp. 79-82, 96-99) | `groupBy(['planId'])` para ingresos; `$queryRaw date_trunc` para visitas/día; trocear en 2-3 lotes; `unstable_cache` 60 s | Medio | 4-6 h |
| **P1-7** | `/admin/pagos`: 3 `findMany` secuenciales sin `take`, con query duplicada en el caso más común (sin pendientes) | Carga completa de tabla en cada visita a pagos | `src/app/(admin)/admin/pagos/page.tsx:56, 87, 126` | Una query con `take:100`, eliminar el fallback, paralelizar | Bajo | 2 h |
| **P1-8** | `/admin/referidos`: ~17 queries (mitad secuenciales), raw sobre JSONB sin índice GIN, `distinct` en memoria sin límite | Full scans que crecen con cada click de referido | `src/modules/referidos/actions.ts:390-524` (esp. 446-477, 520-524) | Consolidar raws, `COUNT(DISTINCT)`, índice GIN sobre `meta` | Medio | 3-4 h |
| **P1-9** | Layouts privados: auth de red + query BD secuenciales en CADA navegación; bloquean el streaming | Suma latencia a toda navegación; `loading.tsx` no aparece hasta resolver el layout | `src/app/(admin)/layout.tsx:12-13` y equivalentes en (cliente), (empleado), (superadmin); `getUnreadCount` re-llama `getUser()` (`src/modules/notificaciones/actions.ts:25`) | Con P0-2 el coste marginal baja a ~0; paralelizar; mover contador de notifs a `<Suspense>` | Bajo | 2-3 h |
| **P1-10** | Cron automatizaciones: 2 queries por usuario en bucle por todas las empresas, sin lock, dedupe con carrera; no existe `vercel.json` que lo programe | Miles de round-trips hasta 60 s degradando la app mientras corre; notificaciones duplicadas en carrera | `src/modules/admin/automatizaciones.ts:31-38, 74-167`; `src/app/api/cron/automatizaciones/route.ts` | Batch: 1 query de existentes + `createMany skipDuplicates`; definir cron en `vercel.json` | Medio | 3-4 h |

### 🟡 P2 — MEDIA

| # | Problema | Impacto | Evidencia | Solución | Riesgo | Est. |
|---|----------|---------|-----------|----------|--------|------|
| **P2-1** | Índices faltantes: `Membership.planId`; compuesto `[companyId,estado,fechaVencimiento]`; `Promocion [activo,archivada,visibilidad,publicadaEn]` (feed público hace full scan); GIN en `ReferralEvent.meta`; `Plan/Sucursal/MetodoPago.companyId`; `Comprobante.membershipId` | Scans que crecen linealmente con los datos | `prisma/schema.prisma` cruzado con queries reales (detalle en §4 del anexo) | Migración de índices (una sola, aditiva) | Bajo | 2-3 h |
| **P2-2** | Queries de Membership filtran por `cliente:{companyId}` (JOIN) en vez del campo indexado `membership.companyId` | Desaprovecha índice en las queries más repetidas | `src/modules/admin/queries.ts:13-16,71-72`; `src/modules/empresas/queries.ts:97-99,245-277,313-317`; `superadmin/dashboard/page.tsx:25-26`; `admin/pagos/page.tsx:59`; `admin/membresias/page.tsx:63` | `where:{companyId}` directo | Bajo | 1-2 h |
| **P2-3** | Transacción interactiva de ~8-10 statements en `confirmarVisita` (pin de conexión en pgBouncer transaction mode) | En hora pico del scanner retiene conexiones escasas | `src/modules/visitas/actions.ts:225-354` | Reducir la tx a las escrituras esenciales; auditLogs a `createMany` fuera | Medio | 2-3 h |
| **P2-4** | `revalidatePath('/', 'layout')` tras acciones frecuentes purga TODO el cache (incluidas públicas ISR) | Re-render masivo tras marcar notificaciones leídas o cambiar de empresa | `src/modules/notificaciones/actions.ts:45`; `src/modules/cliente/actions.ts:61` | Revalidar solo rutas afectadas o tags | Bajo | 1 h |
| **P2-5** | QRScanner: carrera al desmontar durante `start()` deja el MediaStream de la cámara encendido | Móvil del empleado se degrada en el turno; reintentos del scanner fallan | `src/components/scanner/QRScanner.tsx:43-52` | Guardar la promesa de `start()` en ref y encadenar `stop()` a ella | Bajo | 1-2 h |
| **P2-6** | Rate limiter en memoria por instancia serverless (límites erráticos, se resetean por cold start) | Límites reales = N instancias × max; explica `RATE_LIMITED` esporádicos del scanner | `src/lib/rate-limit.ts:19-22` (usado en login/registro/QR/pagos) | Corto plazo: subir límite del scanner; largo: Postgres/Upstash | Bajo | 1 h (corto) |
| **P2-7** | `redirect()` dentro de try/catch en `switchCompany`: el catch se traga `NEXT_REDIRECT` y muestra error aunque el cambio se aplicó | Cambio de empresa "falla" aleatoriamente en la UI | `src/modules/cliente/actions.ts:62-66` | Mover `redirect()` fuera del try o rethrow por `digest` | Bajo | 30 min |
| **P2-8** | Doble salto post-login del cliente (`/cliente/dashboard` → redirect → `/mis-membresias`) | ~4 llamadas Auth extra en el momento de mayor presión | `src/types/index.ts:50`; `src/app/(cliente)/cliente/dashboard/page.tsx:4` | `ROLE_HOME.CLIENTE = '/mis-membresias'` | Bajo | 30 min |
| **P2-9** | `findMany` sin `take` en tickets, referidos de cliente, promociones de cliente, por-vencer, pagos de cliente | Límite implícito = tamaño de tabla; degrada con el crecimiento | `src/modules/soporte/queries.ts:91-100,131-137`; `src/modules/referidos/actions.ts:199-205,260-264`; `src/modules/marketplace/queries.ts:258-289`; `src/modules/admin/queries.ts:144-155`; `src/modules/cliente/queries.ts:259-263` | `take` + paginación (patrón ya presente en `getClienteVisitas`) | Bajo | 2-3 h |
| **P2-10** | Feed de promociones: 4 de 5 queries sin `companyId` ni índice que cubra + ~15-17 queries por carga por cliente | Full scan de promociones por cada cliente que abre el feed | `src/modules/social/queries.ts:171-287`; `(cliente)/cliente/promociones/page.tsx:87-90` | `unstable_cache` 60-300 s en secciones globales + índice P2-1 | Medio | 2-3 h |

### 🟢 P3 — BAJA (higiene)

| # | Problema | Evidencia | Solución | Est. |
|---|----------|-----------|----------|------|
| **P3-1** | React Query y Zustand instalados y **jamás usados** (0 referencias) | `package.json` (`@tanstack/react-query`, `zustand`); grep = 0 | Desinstalar (o adoptar React Query de verdad) | 30 min |
| **P3-2** | Módulo de reportes muerto que materializa toda la tabla `visits` si algún día se conecta | `src/modules/reportes/queries/index.ts:96-111` (sin importadores) | Eliminar o reescribir con `groupBy` | 1 h |
| **P3-3** | `getCompanyStats` trae todas las filas de ratings para contarlas | `src/modules/marketplace/queries.ts:470-483` | `_count` | 30 min |
| **P3-4** | Timeouts UI sin `clearTimeout`; carousel no quita listener `reInit`; Map `loginAttempts` sin poda | `AppHeader.tsx:90`; `ShareButton.tsx:42`; `ui/carousel.tsx:96-105`; `LoginForm.tsx:23-31` | Cleanups de higiene | 1 h |
| **P3-5** | `createAdminClient()` crea cliente nuevo por llamada (11 call sites) | `src/lib/supabase/admin.ts:10-23` | Memoizar a nivel de módulo | 30 min |
| **P3-6** | Rol/tenant viven en `app_metadata` del JWT — al migrar a validación local (P0-2b), un cambio de rol tarda hasta 1 h en propagarse | `src/proxy.ts:54-55`; `src/modules/admin/actions.ts:509` | Al aplicar P0-2b: forzar refresh de sesión tras `updateUserById`; re-chequear BD en mutaciones sensibles | incluido en P0-2 |

---

## 3. Verificaciones pendientes en producción (no visibles desde el repo)

1. **Vercel → `DATABASE_URL`**: confirmar que incluye `pgbouncer=true` y añadir `connection_limit` + `pool_timeout` (P0-4).
2. **Supabase → Dashboard → Auth → Rate limits / Logs**: buscar 429 en `/auth/v1/user` y `/auth/v1/token` en las horas de fallo (confirmación empírica de P0-1/P0-2).
3. **Supabase → Database → Pooler**: `SHOW POOLS` bajo carga; buscar errores `P2024` en logs de Vercel.
4. **¿Quién invoca el cron?** No hay `vercel.json`; confirmar el invocador externo de `/api/cron/automatizaciones` y su frecuencia (correlacionar con los minutos de degradación).

## 4. Plan de corrección propuesto (Fase 10, tras aprobación)

Orden diseñado para atacar primero las causas raíz con mínimo riesgo, validando cada etapa antes de continuar:

| Etapa | Contenido | Resultado esperado | Est. |
|-------|-----------|--------------------|------|
| **1. Núcleo auth** | P0-1, P0-2a (`React.cache`), P0-3, P1-1, P1-2, P2-8 | Elimina logouts fantasma y ~90 % de llamadas a Supabase Auth | 1 día |
| **2. Pool y N+1 críticos** | P0-4 (config), P1-3, P1-4, P1-5, P1-6, P2-1 (índices), P2-2 | Elimina timeouts de BD; dashboards de ~150 → <10 queries | 1-2 días |
| **3. Amplificadores** | P1-7, P1-8, P1-9, P1-10, P2-4, P2-9, P2-10 | Reduce carga sostenida y picos del cron | 1 día |
| **4. Higiene y robustez** | P2-3, P2-5, P2-6, P2-7, P3-* | Scanner estable, límites coherentes, deps limpias | 0.5-1 día |
| **Validación** | Build + lint + smoke de flujos por rol tras cada etapa; al final batería completa (login por rol, membresías, QR/scanner, pagos, referidos, promociones, dashboards, notificaciones, historial, perfil, marketplace) | Plataforma estable en sesiones largas | 0.5 día |

**Regla acordada:** cada corrección se valida antes de pasar a la siguiente. Nada de features nuevas, pantallas nuevas ni cambios de diseño.

---

## 5. Estado de ejecución (implementado)

Todas las etapas fueron implementadas, revisadas con una auditoría adversarial de código (8 ángulos) y validadas con `prisma validate` + `tsc --noEmit` + `eslint` + `next build` (compilación y generación de las 60+ rutas) en verde tras cada commit.

| Etapa | Commit | Contenido |
|-------|--------|-----------|
| 1 · Núcleo auth | `4ae3c18` | P0-1, P0-2a (React.cache), P0-3, P1-1, P1-2, P2-7, P2-8 |
| 2 · Pool y N+1 | `c65f520` | P0-4, P1-3, P1-4, P1-5, P1-6, P2-1 (migración de índices), P2-2 |
| 3 · Amplificadores | `d3bc534` | P1-7, P1-8, P1-10 (+`vercel.json`), P2-4, P2-9, P2-10 |
| 4 · Higiene | `2749fdd` | P2-3, P2-5, P2-6, P3-1..P3-5 |
| 5 · Fixes de code-review | `7d35c7e` | Seguridad (fallback getSession), TOCTOU+auditoría en confirmarVisita, tz del dashboard, error state de pagos, companyId en automatizaciones |

### Nota de seguridad importante (Etapa 5)

La primera versión de la Etapa 1 introdujo un fallback a `getSession()` en errores transitorios que decodificaba el JWT de la cookie **sin verificar la firma** y lo usaba para autorización de rol. La auditoría de código lo detectó (escalada de privilegios durante un 429/outage) y se corrigió: `getUser()` ahora **reintenta** la validación con firma verificada y el middleware hace fail-closed; nunca se autoriza sobre un token sin verificar.

## 6. Validación pendiente en tu entorno (requiere BD + Supabase)

Este contenedor no tiene base de datos ni credenciales, así que la validación runtime debe hacerse con `.env` de staging apuntando a una BD real:

1. **Aplicar la migración de índices**: `bun run db:migrate:deploy` (aplica `20260718_add_stability_indexes`). Es aditiva e idempotente.
2. **Configurar en Vercel** `DATABASE_URL` con `pgbouncer=true&connection_limit=1&pool_timeout=20`.
3. **Batería de humo por rol** (login → navegar cada módulo): cliente (membresías, historial, referidos, promociones, perfil, pagos), empresa/admin (dashboard, clientes, pagos, planes, empleados, reportes, automatizaciones, notificaciones), empleado (scanner: confirmar visita, verificar descuento de saldo y QR de un solo uso), superadmin (dashboard, empresas, reportes), marketplace y landing pública.
4. **Prueba de sesión larga**: mantener la app abierta y navegando 20-30 min con varias cuentas simultáneas; confirmar que no hay degradación ni expulsiones a `/login`.
5. **Confirmar el cron**: `vercel.json` programa `/api/cron/automatizaciones` a las 09:00 UTC; verificar en el dashboard de Vercel que el cron quedó registrado tras el deploy.
