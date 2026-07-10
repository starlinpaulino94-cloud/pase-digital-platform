# Auditoría completa — Todo lo pendiente, organizado por fases

**Fecha:** 2026-07-08
**Método:** 5 auditorías paralelas sobre el código real: (1) cobertura del plan de onboarding, (2) higiene/deuda técnica, (3) preparación para producción, (4) testing y CI, (5) funcionalidad de negocio y UX.

**Balance general:** el código de producción es cuidadoso (guards fail-closed, transacciones anti-TOCTOU, sin TODOs sueltos, sin páginas falsas), pero hay **4 bloqueantes de seguridad/operación**, el **ciclo de renovación de membresías está roto**, hay **0% de tests y 0 CI**, y faltan piezas de negocio (emails transaccionales, recibos, monetización SaaS).

---

## 🔴 FASE 0 · Acciones operativas inmediatas (sin código — dashboards de Supabase/Vercel)

| # | Acción | Por qué |
|---|--------|---------|
| 0.1 | **Verificar exposición PostgREST**: en Supabase → Settings → API → "Exposed schemas", comprobar si `public` está expuesto. Las 33 tablas de la app **no tienen RLS**; si `public` está expuesto, cualquiera con la anon key (pública, va en el bundle del frontend) puede leer/escribir `users`, `memberships`, `comprobantes`, etc. con un simple `curl`. | **El hallazgo más grave de toda la auditoría.** |
| 0.2 | Confirmar en Vercel: `CRON_SECRET` definida (sin ella el cron diario responde 503 en silencio y las automatizaciones nunca corren) y `BOOTSTRAP_ENABLED` ausente o `false`. | Operación básica |
| 0.3 | Terminar la prueba de Resend en Preview (registro → correo → confirmar → login) y activar "Confirm email" en Supabase Auth. | Ya en curso |
| 0.4 | Retirar las credenciales de prueba en texto plano de `docs/PRODUCTION_READINESS.md:584-597`; asegurar que `prisma/seed.ts` (passwords `admin123`) jamás corra contra producción. | Higiene de secretos |
| 0.5 | Documentar/verificar backups de Supabase (plan, PITR, prueba de restore). Hoy no hay nada documentado. | Recuperación ante desastre |

**Esfuerzo:** medio día (más lo que tarde el DNS/Resend).

---

## 🔴 FASE 1 · Seguridad crítica (código) — antes de crecer en usuarios

| # | Tarea | Evidencia | Est. |
|---|-------|-----------|------|
| 1.1 | **RLS deny-all en todas las tablas** (o quitar `public` de los schemas expuestos): migración SQL `ALTER TABLE … ENABLE ROW LEVEL SECURITY` para las 33 tablas. Prisma se conecta directo a Postgres, así que la app no se ve afectada. | Cero `ENABLE ROW LEVEL SECURITY` en todo el repo | 0.5 d |
| 1.2 | **Políticas de Storage con scoping por dueño**: hoy cualquier usuario autenticado puede sobrescribir/borrar CUALQUIER archivo de `avatars`, `logos` y `comprobantes`. | `prisma/migrations_manual/2026-07-storage-buckets.sql:43-62` | 0.5-1 d |
| 1.3 | **Cablear el rate limit de login server-side**: `loginLimiter` existe (`src/lib/rate-limit.ts:53`) pero nunca se usa; el límite actual vive en un Map del navegador (`LoginForm.tsx:24-50`), evadible con curl. | Hueco real | 0.5-1 d |
| 1.4 | **Tickets de soporte**: añadir rate limit a `crearTicket`/`responderTicketCliente` y **escapar el HTML** de `asunto`/`descripcion` que hoy se interpolan crudos en el correo al buzón del negocio (inyección de HTML). | `src/modules/soporte/actions.ts:248-341, 325-328, 496` | 0.5 d |
| 1.5 | Contadores públicos de promociones (`viewCount`/`shareCount`) manipulables: el "rate limit" es una cookie que controla el cliente. Mover a límite server-side. | `src/modules/marketplace/actions.ts:10-86` | 0.5 d |
| 1.6 | Comparación constant-time del `CRON_SECRET` (los endpoints bootstrap ya lo hacen bien; el cron no). | `src/app/api/cron/automatizaciones/route.ts` | 0.1 d |
| 1.7 | Comprobantes de pago a bucket **privado** + `createSignedUrl` (hoy son públicos con la URL exacta; riesgo aceptado y documentado, pero conviene cerrarlo). | `docs/STORAGE_SETUP.md:34-41` | 1 d |

**Esfuerzo total:** ~3-4 días.

---

## 🟠 FASE 2 · Núcleo de negocio roto o incompleto — ingresos recurrentes

| # | Tarea | Evidencia | Est. |
|---|-------|-----------|------|
| 2.1 | **Marcar membresías VENCIDA automáticamente** en el cron diario: hoy nada las expira (solo se detecta "lazy" en el scanner); en BD una vencida sigue `ACTIVA` para dashboards, segmentos y reportes. | `src/modules/admin/automatizaciones.ts` (solo notifica), `visitas/actions.ts:125,263` | 0.5-1 d |
| 2.2 | **Renovación self-service del cliente**: `RenovarButton.tsx` es código muerto; la notificación "por vencer" enlaza a `/cliente/pagos` pero esa página no ofrece renovar; `enviarComprobante` no acepta estado `VENCIDA`. El cliente NO puede renovar solo — fuga directa de ingresos recurrentes de las empresas. | `src/components/membresia/RenovarButton.tsx`, `membresia/actions.ts:253`, `cliente/pagos/page.tsx:42,165` | 1-2 d |
| 2.3 | **Emails transaccionales de negocio** (Resend ya está cableado, casi sin uso): pago aprobado, pago rechazado (con motivo), membresía activada, membresía por vencer, membresía vencida, bienvenida tras registro. Hoy TODO lo crítico queda solo en la campana in-app. | `src/lib/email.ts` (solo verificación/invitación/tickets) | 2-3 d |
| 2.4 | Emitir la notificación `MEMBRESIA_ACTIVADA` (el enum existe y tiene emoji en la campana, pero nunca se emite). | `schema.prisma:34` | 0.1 d |
| 2.5 | **Consolidar migraciones**: crear `0_init` desde `prisma/baseline/full_schema.sql` + `prisma migrate resolve`; incorporar el SQL manual (support_tickets, faq, CRM, storage) al historial formal; actualizar `prisma/MIGRATIONS.md` (cita como pendiente una migración 17 versiones atrás). Sin esto, `migrate deploy` futuro es impredecible y una BD nueva no se reconstruye. | `prisma/migrations_manual/*`, `prisma/MIGRATIONS.md` | 1 d |
| 2.6 | **Validación de env al arranque**: schema central (zod ya está instalado) para `DATABASE_URL`, `CRON_SECRET`, `RESEND_API_KEY`, etc. Hoy un typo falla tarde y en silencio (el email degrada a `console.warn`). | `src/lib/env.ts` (solo 3 vars, lazy) | 0.5 d |
| 2.7 | Flujo de **reenviar correo de verificación** (O-1): si el enlace expira, el correo dice "vuelve a registrarte" pero el email ya está ocupado — callejón sin salida. Traducir el error crudo "Email not confirmed" del login. | `emailVerification.ts:76-78`, `LoginForm.tsx:83-88` | 1 d |

**Esfuerzo total:** ~6-8 días.

---

## 🟠 FASE 3 · Red de seguridad de desarrollo — tests, CI y manejo de errores

Hoy: **0 tests, 0 CI, zod instalado pero jamás importado**, lint suavizado, 207 `console.error` vs 7 `captureException`.

| # | Tarea | Est. |
|---|-------|------|
| 3.1 | **CI mínimo en GitHub Actions**: `npm ci` + `prisma generate` + `eslint` + `tsc --noEmit` en cada PR (hoy nada bloquea un merge roto salvo el build de Vercel). | 0.5 d |
| 3.2 | **Vitest + tests unitarios de funciones puras**: `calcularDescuentoBienvenida`, `createRateLimiter`, `safeInternalPath`, `escapeHtml`. ROI inmediato, sin mocks. | 1 d |
| 3.3 | **Adoptar zod en las server actions críticas** (registro, membresía, visitas, invitaciones): hoy se parsea FormData crudo con validaciones ad-hoc (regex de email débil, `anio` acepta 99999, campos sin límite de longitud). | 2-4 d |
| 3.4 | **Dejar de tragar errores**: ~30 sitios con `.catch(() => null/[]/0)` sin log ni Sentry (layouts, queries, y 4 rollbacks silenciosos que dejan registros huérfanos sin rastro). Añadir `captureException` en los catch de server actions. | 1-2 d |
| 3.5 | **Tests de integración con BD de prueba** para las invariantes de dinero/acceso: `confirmarVisita` (QR de un solo uso, decremento de saldo, concurrencia), `seleccionarPlan` + descuento, guards multi-tenant. Los casos ya están definidos en `docs/FASE_E_TESTING.md`. | 1 sem |
| 3.6 | **Limpieza de código muerto**: 7 componentes huérfanos (`BarrasEmpresas`, `MembresiasPie`, `VisitasChart`, `PlanSelector`, `RenovarButton`†, `FeaturedPromotions`, `StatsBar`), `ui/chart.tsx` → **recharts eliminable del bundle**, `/api/stats` sin consumidores, exports muertos. †`RenovarButton` se revive en 2.2, no se borra. | 0.5 d |
| 3.7 | **Deduplicar**: helper compartido para el patrón "crear usuario Supabase + fila BD + rollback" (repetido en 5 archivos), `safeCount`, mapas estado→etiqueta de membresía (5 copias con textos inconsistentes: "Pago enviado" vs "Esperando pago"). | 1 d |
| 3.8 | Higiene menor: renombrar `MembresíasTable.tsx` (tilde en nombre de archivo = problemas Unicode entre SOs), subir `no-explicit-any` a error, prettier + husky, eliminar los `as unknown as` de las tablas admin arreglando el genérico de `DataTable`. | 1 d |
| 3.9 | Playwright E2E smoke (3-5 flujos: registro→plan→comprobante, login por rol, invitación) contra Supabase local. | 1-2 sem (opcional aquí, puede ir después) |

**Esfuerzo total (sin 3.9):** ~7-10 días.

---

## 🟡 FASE 4 · Completar el onboarding y la configuración regional

Estado del plan original: 9 ítems completos, 2 tras flag (O-1, O-16), 4 parciales, 1 sin implementar.

| # | Tarea | Evidencia | Est. |
|---|-------|-----------|------|
| 4.1 | **Barrido de formateo regional (O-7)**: quedan ~50 usos hardcodeados de `es-DO`/`RD$` en ~35 archivos pese a existir `formatMoney`/`formatDate` + `getRegionalPrefs`. Los más visibles: tablas admin de clientes/membresías, formularios de planes ("Precio (RD$)"), scanner, promociones, historial del cliente. | `src/lib/format.ts` existe; grep `es-DO`/`RD$` | 2-3 d |
| 4.2 | **O-10 (único sin implementar)**: ofrecer crear la sucursal principal en el paso de ubicación del onboarding; ítem en el checklist. | Cero referencias a sucursal en `onboarding.ts`/`WizardEmpresa` | 1 d |
| 4.3 | Añadir el paso "Configuración" (regional/marca) al wizard B2B — el formulario existe en `/admin/perfil` pero el wizard nunca dirige a él ni lo cuenta. | `src/modules/empresas/onboarding.ts:48-105` | 0.5 d |
| 4.4 | Guard de onboarding a nivel de proxy/middleware (hoy solo redirige desde el dashboard; entrar directo a `/admin/planes` lo evita). Decidir si es deseado ("explorar mi panel" es intencional). | `admin/dashboard/page.tsx:88-95` | 0.5 d |
| 4.5 | O-12: mostrar el beneficio de bienvenida (O-13) al referido en la pantalla de registro (hoy solo hay un badge "Vienes por una invitación"). | `CompanyRegistroHeader.tsx:52-61` | 0.5 d |
| 4.6 | `Cliente.idioma`: columna huérfana — exponerla en el ProfileForm o eliminarla. Persistencia D1 (`onboardingCompletedAt`) si se quieren métricas de finalización. | `schema.prisma:372` | 0.5 d |
| 4.7 | **Google OAuth (O-16)**: configuración externa pendiente — credenciales en Google Cloud + proveedor en Supabase + flag. ⚠️ Activar SOLO después de que la verificación de correo esté funcionando (vector de account-takeover documentado en `.env.example:93-100`). | Config externa | 0.5 d |

**Esfuerzo total:** ~5-6 días.

---

## 🟡 FASE 5 · Control de la plataforma y gestión de equipo

| # | Tarea | Evidencia | Est. |
|---|-------|-----------|------|
| 5.1 | **La suspensión de empresa no suspende nada**: `isActive:false` solo la oculta del marketplace; la empresa suspendida sigue operando su panel, escaneando y cobrando. Verificar `isActive` en el proxy/layouts/login. | `proxy.ts` no lo chequea | 1 d |
| 5.2 | **Moderación de empresas nuevas**: el registro self-service crea la Company activa de inmediato; sin aprobación del superadmin. Añadir estado pendiente/aprobada (enum en vez de dos booleanos). | `registro/empresaActions.ts:83-92` | 1-2 d |
| 5.3 | **Gestión de equipo completa**: (a) cambiar rol de un miembro, (b) desactivar (soft) sin borrado duro, (c) gestionar miembros no-EMPLEADO — hoy GERENTE/CAJERO/MARKETING/SUPERVISOR quedan ingestionables una vez creados, (d) asignación empleado↔sucursal (`sucursalId` declarado en AppMetadata pero nunca asignado). | `admin/actions.ts:526`, `empleados/[id]/page.tsx` | 2-3 d |
| 5.4 | Recordatorio de vencimiento configurable por empresa (hoy fijo a 7 días). | `automatizaciones.ts:66` | 0.5 d |
| 5.5 | Cron de automatizaciones: procesar empresas en paralelo o por lotes (hoy secuencial con `maxDuration=60` — con decenas de empresas excede el timeout). | `automatizaciones.ts:181-187` | 0.5 d |
| 5.6 | Rate limiting distribuido (Upstash/Postgres) si el anti-abuso importa: el actual es por instancia serverless y se resetea en cold start (limitación P2-6 documentada). | `rate-limit.ts:18-29` | 1 d |

**Esfuerzo total:** ~6-8 días.

---

## 🟢 FASE 6 · Experiencia móvil y pagos formales

| # | Tarea | Evidencia | Est. |
|---|-------|-----------|------|
| 6.1 | **Service worker / PWA offline**: el QR NO funciona sin conexión — el caso de uso central (mostrador sin señal). Manifest existe; falta SW + cache del pase. Añadir iconos maskable, themeColor. | Sin SW en el repo | 2-3 d |
| 6.2 | **Recibos de pago**: no existe ningún documento emitido tras aprobar un pago (el único "recibo" es el térmico de visita). Generar recibo consultable/descargable. | `ComprobanteReceipt.tsx` es de visitas | 2 d |
| 6.3 | Entidad `Pago` propia (hoy el pago vive como campos en Membership + AuditLog): habilita historial real, pagos parciales, moneda. | schema | 2 d |
| 6.4 | Bottom-nav móvil para el cliente (hoy solo hamburguesa) + `/cliente/intereses` en el menú. | UX | 1 d |
| 6.5 | **Pasarela de pagos** (Stripe/Azul/CardNet…): webhook con firma verificada + idempotencia + conciliación. El punto de extensión ya está previsto (`pagos/activacion.ts:3-4`). | Decisión de producto | 1-2 sem |
| 6.6 | Wallet passes (Apple/Google) para el QR. Opcional. | — | 3-5 d |
| 6.7 | CSP endurecida con nonces (quitar `unsafe-inline`/`unsafe-eval`) — pospuesto documentado; requiere pruebas de scanner + hidratación. | `next.config.ts:59-63` | 2-3 d |

---

## 🔵 FASE 7 · Monetización SaaS (requiere decisión de negocio ANTES de construir)

**Hoy las empresas usan MembeGo gratis.** No existe en el schema nada de: plan de plataforma, suscripción de empresa, trial, límites por plan (nº clientes/sucursales/empleados) ni facturación de MembeGo a las empresas.

Decisiones previas: ¿modelo freemium/trial? ¿límites por plan? ¿cobro manual o con pasarela (depende de 6.5)? ¿precios?

Construcción estimada tras decidir: modelo de datos + enforcement de límites + panel de billing en superadmin + cobro — **2-3 semanas**.

---

## Resumen ejecutivo

| Fase | Tema | Esfuerzo | Urgencia |
|------|------|----------|----------|
| 0 | Operativa inmediata (RLS check, cron, backups, Resend) | 0.5 d | 🔴 HOY |
| 1 | Seguridad crítica en código | 3-4 d | 🔴 Esta semana |
| 2 | Núcleo de negocio (vencimiento, renovación, emails) | 6-8 d | 🟠 Alta |
| 3 | Tests + CI + manejo de errores + limpieza | 7-10 d | 🟠 Alta (en paralelo con 2) |
| 4 | Completar onboarding + regional + Google OAuth | 5-6 d | 🟡 Media |
| 5 | Control de plataforma + equipo | 6-8 d | 🟡 Media |
| 6 | PWA offline + recibos + pasarela | 2-4 sem | 🟢 Según negocio |
| 7 | Monetización SaaS | 2-3 sem | 🔵 Decisión de negocio |

**Total estimado (fases 1-5):** ~28-36 días de desarrollo.
