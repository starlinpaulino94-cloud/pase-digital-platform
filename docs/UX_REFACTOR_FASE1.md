# UX/UI Refactor — Fase 1: Auditoría y Estrategia

> Auditoría completa de la interfaz (4 pasadas paralelas: admin, cliente+escáner,
> auth/onboarding/público, design system/shell/superadmin). ~110 páginas y ~150
> componentes leídos archivo por archivo. Evidencia detallada con `file:line` en
> los reportes de trabajo; aquí el diagnóstico y el plan.

---

## 1. Diagnóstico central

**MembeGo ya tiene un design system serio — el problema es que la app no lo usa.**

`globals.css` define una fundación completa y bien pensada: paleta oklch clara y
oscura, estados semánticos (`--success/--warning/--info/--destructive`), escala
tipográfica (`text-display…text-caption`), sombras (`elevation-1/2/3`,
`shadow-premium/glow`), radius, texturas (`glass`, `bg-grid`), animaciones con
`prefers-reduced-motion`, scrollbar y focus-visible. Hay 52 componentes en
`ui/` (shadcn + custom: PageHeader, StatCard, EmptyState, DataTable,
ConfirmDialog). Geist como fuente, lucide en 177 archivos (100 % consistente),
sonner en 63 archivos.

La adopción, en cambio, es marginal:

| Métrica | Valor |
|---|---|
| Clases de paleta cruda vs tokens (panel admin) | **654 vs 69 (90/10)** |
| Archivos con `slate-*` crudo | 68/112 en `src/app`, 90/171 en `src/components` |
| `PageHeader` | 2 de 71 páginas de panel (91 `<h1>` a mano en 3 variantes) |
| `EmptyState` | 6 usos; ~17 empties reimplementados a mano |
| `ConfirmDialog` | **0 usos; 14 `window.confirm()` nativos** |
| `StatCard` | 4 usos; 2 reimplementaciones locales |
| Componentes ui/ con 0 imports | ~26 (peso muerto o sin adoptar) |
| Colores de "primario" compitiendo | 5 (`--primary`, sky-500, blue-600, emerald-600, indigo-600) |
| Dark mode | Definido al 100 % en tokens; inaccesible (sin ThemeProvider) y roto por el hardcode claro |

**Conclusión:** esto no es un proyecto de "construir un design system" sino de
**migración + enforcement + rediseño puntual** de los flujos con gaps reales de
UX (escáner, navegación móvil, confirmaciones, manejo de errores).

## 2. Hallazgos críticos (los 10 que más duelen)

1. **Escáner: permiso de cámara denegado = pantalla muerta.** `QRScanner.tsx:33-35`
   tiene un `catch {}` vacío: el empleado queda ante un rectángulo negro sin
   mensaje ni salida. Es el caso de uso central del negocio.
2. **Escáner sin capa física:** sin linterna (inservible con poca luz), sin
   vibración/beep al leer, y re-escanear exige volver a pantalla fría + tap +
   arranque de cámara por cada cliente.
3. **Sin navegación móvil real.** Cliente (10 secciones tras hamburguesa) y
   empleado usan un layout desktop encogido; no hay bottom-nav ni scanner a
   pantalla completa. Son usuarios 100 % telefónicos.
4. **Link roto:** `MembresíasTable.tsx:71` enlaza a `/admin/membresias/[id]`,
   ruta que no existe → cada "Ver detalles" da 404.
5. **Errores de BD disfrazados de "no hay datos"** en ~11 listados admin
   (catch → lista vacía). El admin cree que no tiene clientes cuando falló el
   sistema. (`pagos/page.tsx` lo hace bien; es el patrón a replicar.)
6. **Acciones masivas y financieras sin confirmación:** ejecutar automatizaciones
   (envíos a todos), notificar a un segmento completo, aprobar un pago — un clic.
7. **Login muestra errores crudos de Supabase en inglés** ("Invalid login
   credentials") en el momento de mayor exposición del producto.
8. **Marketplace sin paginación:** `limit: 50` fijo; la empresa/promoción nº 51
   es invisible para siempre.
9. **Tres marcas de acento conviven:** azul eléctrico (tokens) vs sky/blue
   (CTAs) vs emerald + `#0f172a` (auth, onboarding, 404). El logo "MembeGo"
   está duplicado 4 veces con markup distinto.
10. **El propio kit contradice sus tokens:** `data-table` (bg-white/slate + bug
    de exportCSV que produce `[object Object]`), `NotificationBell`,
    `confirm-dialog` (rojos crudos), `EstadoBadge` (verde/amarillo crudos),
    `estadoBadgeClass()` en `lib/soporte.ts`. Arreglarlos arregla decenas de
    pantallas de golpe.

## 3. Fortalezas a conservar

- Lógica de dominio del escáner excelente: 10 códigos de error tipados con
  "qué hacer", alertas proactivas ("vence en N días"), recibo térmico 80 mm,
  QR de un solo uso con regeneración.
- Shell responsive con drawer móvil real; página activa con barra de acento;
  búsqueda con atajo `/`; nav filtrada por rol.
- Landing pública de calidad (usa `shadow-premium`, `glass`, `bg-grid-light`).
- `PromotionCard`, `mis-membresias`, `tickets`, `comunicacion`,
  `superadmin/empresas` (EmpresasCRM): las páginas "nueva generación" ya
  demuestran el estándar al que migrar el resto.
- Toasts estandarizados (sonner, 0 `window.alert`), lucide 100 %, Geist, focus-visible global.

## 4. Estrategia de rediseño — 6 etapas

**Principio rector:** primero reparar el sistema (que el estándar exista y sea
obligatorio), después migrar pantallas en orden de impacto, con el escáner como
primer rediseño profundo por ser el corazón operativo del negocio.

### Etapa 1 — Fundación (el sistema se arregla a sí mismo)
- Tokenizar los multiplicadores: `data-table` (+fix exportCSV), `NotificationBell`,
  `confirm-dialog`, `EstadoBadge`, `stat-card`, `estadoBadgeClass`.
- Eliminar variantes `brand` rotas de button/badge (referencian un token inexistente).
- Componentes nuevos que las etapas siguientes consumen: `StatusBanner`
  (success/warning/info/destructive), `DeleteButton` genérico sobre ConfirmDialog,
  `PasswordInput` (mostrar/ocultar), `Logo` adoptado en los 4 sitios duplicados.
- Shell: a11y del drawer (ESC, role=dialog, focus), `SUPERADMIN_NAV` derivado por
  composición, `loading/error.tsx` para (onboarding), `prefers-reduced-motion` completo.
- Regla de radius documentada (contenedores 2xl, controles xl, chips lg).

### Etapa 2 — Escáner QR (rediseño profundo, prioridad del negocio)
- Permisos: estado explícito de denegado/sin cámara con instrucciones + CTA a
  entrada manual; aviso previo al primer prompt.
- Cámara: overlay propio (esquinas + línea de barrido), **linterna**, vibración +
  flash verde al leer, pantalla "Verificando cliente…" con identidad.
- Loop sin fricción: "Escanear siguiente" directo desde recibo y desde error
  (sin pasar por pantalla fría); layout a pantalla completa en móvil.
- Resultados tokenizados (éxito/rechazo/advertencias); hint del código manual;
  quitar `error.stack` del boundary; unificar las 2 páginas duplicadas.
- Vista "Hoy" del empleado: visitas registradas + contexto.

### Etapa 3 — Panel admin, módulo por módulo
- Barrido mecánico global: mapa de sustitución de clases (~500 de 654 usos),
  quitar `bg-sky-500` de 18 Buttons, `Button asChild`, aria-labels, grids responsive.
- Adopción por página: PageHeader (35+), EmptyState con CTA (~17), patrón
  `loadError` en los 11 listados que tragan errores, ConfirmDialog en los 14
  `confirm()` + aprobar pago/automatizaciones/notificaciones masivas.
- Fixes puntuales: link roto de membresías, filtros PENDIENTE_PAGO/RECHAZADA,
  form anidado de comunicación, hack DOM del Switch (5 forms), CRON_SECRET oculto.
- Rediseños dirigidos: **Referidos** (tabs métricas/reglas, jerarquía),
  **PerfilPublicoForm** (secciones con guardado + sticky save), dropdowns caseros → DS.

### Etapa 4 — Panel cliente mobile-first
- **Bottom-nav** de 4-5 destinos (variante del AppShell por rol).
- Tokens en las 9 páginas crudas; PageHeader/EmptyState/StatCard; EmpresaCard
  compartida (2 duplicadas); StatusBanner en planes/pagos/mis-membresias.
- Referidos del cliente con jerarquía (hero = compartir); historial con semántica
  corregida; "Reintentar" real (router.refresh); "Oportunidades" → "Planes".

### Etapa 5 — Auth, onboarding y público
- Auth premium sobre tokens (adiós `#0f172a` + emerald + 25 overrides copy-paste);
  errores de Supabase mapeados a español; PasswordInput; checkboxes/progress del DS.
- Onboarding: unificar WizardEmpresa/WizardCliente; "volver al asistente".
- Público: PromotionDetail rediseñada (es la landing de todo lo compartido),
  CompanyCard tokenizada, paginación de marketplace, footer/legales arreglados,
  funnel de registro con contexto visual único.

### Etapa 6 — Pulido transversal
- Dark mode: ThemeProvider + toggle (ya viable tras la migración), sonner/scrollbar.
- Breadcrumbs jerárquicos + Cmd+K sobre command.tsx; skeletons por forma de
  página; not-found por grupo (dentro del shell); transiciones de página sutiles;
  barrido final de accesibilidad (targets 44 px, contraste, aria).
- Purga del kit: borrar los componentes con 0 usos que no se hayan adoptado.

**Fuera de alcance UX (colas para fases de negocio):** paginación server-side
completa, servicios del escáner configurables por empresa (modelo de datos),
modo offline/PWA del empleado, rate-limit de login en servidor.

## 5. Reglas del sistema (enforcement)

1. Colores: SOLO tokens (`primary`, `muted`, `foreground`, `success/warning/info/destructive`). Prohibido `slate-*`, `sky-*`, `bg-white` en páginas.
2. Todo título de página = `PageHeader`; todo vacío = `EmptyState` con CTA; toda
   acción destructiva/masiva = `ConfirmDialog`.
3. Botones-link = `Button asChild`; nunca `<Link><Button>` ni `<a>` interno.
4. Error de carga ≠ estado vacío: patrón `loadError` visible con "Reintentar".
5. Radius: contenedores `rounded-2xl`, controles `rounded-xl`, chips `rounded-lg`.
6. Icon-buttons siempre con `aria-label`; targets táctiles ≥ 44 px en móvil.
