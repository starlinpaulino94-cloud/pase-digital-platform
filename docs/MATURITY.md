# Fase 6 — Product Maturity & Feature Evolution

Auditoría integral del producto (2026-07-16) y reglas de evolución. A partir
de aquí, **la calidad manda sobre la cantidad**: ninguna funcionalidad nueva
entra si viola el feature gate (§6).

## 1 · Auditoría integral — resultados medidos

Verificaciones ejecutadas sobre el código real (no opiniones):

| Área | Verificación | Resultado |
| --- | --- | --- |
| Tipos | `tsc --noEmit` repo completo | **0 errores** ✅ |
| Lint | `eslint src packages` completo | 1 error (corregido en esta fase) + 9 warnings menores |
| Build | `next build` producción | exit 0, sin warnings de CSS ✅ |
| Seguridad · guards | Barrido de `'use server'` en `src/modules` | **Todas** las acciones con guard (`requireRole`/`requireAdminUser`/`requireSection`/`staffAutorizado`); las 4 sin guard son públicas por diseño (logout, registro con `registerLimiter`, contadores de vistas del marketplace) |
| Seguridad · límites | Rate limiting | `registerLimiter` (registro), `paymentLimiter` (pagos/compras), `formSubmitLimiter` (caja), limiter de share; login cubierto (fase 1.4) |
| Seguridad · headers | CSP / X-Frame-Options | configurados en `next.config` (fase 4.4) ✅ |
| Multi-tenant | `companyId` en queries de módulos | patrón verificado en caja/facturas/scanner (fases POS/FAC) |
| UX/UI | Contra checklist CX2/MDS | pantallas del cliente pasan; deuda de consistencia contada abajo |
| Motion | reduce-motion | 100% de utilidades MMS neutralizadas vía `@media`; verificación global en `globals.css` |
| Journey | Recorridos CJO §1 | flujos vivos extremo a extremo (registro→bienvenida→beneficio→QR→canje→invita→compra→POS) |

## 2 · Informe de deuda técnica

| Hallazgo | Medición | Prioridad |
| --- | --- | --- |
| `setState` síncrono en efecto (CampanasVivas) | 1 error eslint | **P1 — CORREGIDO** (índice derivado con módulo, efecto eliminado) |
| Imports sin uso + refs en render (data-table) | 9 warnings | P2 |
| `AnimatedCounter` (system) duplica `AnimatedNumber` (kit) | 5 archivos | P2 — migrar y borrar el viejo |
| `QrFab.tsx` sin uso (referencia doc) | 1 archivo | P3 — borrar al migrar docs |
| Popup inteligente no consume aún el motor MEE | 1 componente | P2 — unificar escalera |
| Virtualización de listas largas | no necesaria aún (`take` acota) | P3 — revisar al crecer datos |

## 3 · Informe de deuda de diseño

| Hallazgo | Medición | Prioridad |
| --- | --- | --- |
| Hex sueltos en componentes | 26 archivos (varios legítimos: confetti, botón Google, gradientes de marca en OG) | P2 — migrar los no-legítimos a tokens |
| Títulos manuales `text-2xl font-bold` en vez de `.text-h*` | ~100 usos (mayoría en panel admin) | P2 — barrido por módulo |
| Dinero/fechas/estados sin `Price`/`DateText`/`StatusChip` | transversal | P2 — cola 2.x ya planificada |
| Chips de estado ad-hoc (`bg-success/15…`) repetidos | facturas/pagos/admin | P2 — unificar en `StatusChip` |

## 4 · Informe de rendimiento

- Server Components por defecto; skeletons por ruta; `React.cache` en
  lecturas repetidas del share engine; imágenes vía `sharp`/CDN.
- Animaciones: solo `transform/opacity` (60 FPS, compositor GPU); cero
  librerías de motion en el bundle (CSS + rAF + canvas).
- Consultas: `Promise.all` en cargas paralelas del Home/Perfil; `take`
  acota listados; sin N+1 detectado en los módulos revisados (los feeds
  agregan con `findMany` + mapas, no bucles de queries).
- **Pendiente de medir en producción (P2)**: Lighthouse/Core Web Vitals
  reales (requiere entorno productivo; el sandbox no alcanza membego.com).

## 5 · Informe de accesibilidad

- Focus visible global, targets ≥44 px en botones estándar, contraste AA
  por pares de tokens, reduce-motion total, teclado en overlays (Radix) y
  paleta Ctrl+K. Riel de sidebar con `title` + `aria-label` por icono.
- **Revisar (P2)**: ~18 coincidencias de `<img` sin `alt` en la misma línea
  (mayoría falsos positivos de JSX multilínea — auditar una a una) y 4
  botones `size="icon"` sin `aria-label` en la línea.

## 6 · Feature gate (regla de entrada de funcionalidades)

Una funcionalidad NO se implementa si: hay P0 abierto · rompe el checklist
CX2 §16 · no responde las 11 preguntas de aceptación (problema, beneficio
usuario/empresa, journey, conversión, retención, reutilización, MDS, MMS,
MEE, configurable desde admin) · exige componentes fuera del MUK sin pasar
por el kit · deja la documentación desactualizada.

**Estado del gate: ABIERTO** — no hay P0; el único P1 quedó corregido en
esta misma fase.

## 7 · Matriz de prioridades

- **P0 (bloqueantes)**: ninguno encontrado. ✅
- **P1**: CampanasVivas setState-en-efecto — **corregido aquí**.
- **P2**: warnings de lint · AnimatedCounter→AnimatedNumber · hex y títulos
  manuales (barrido por módulo) · Price/DateText/StatusChip · popup→motor
  MEE · CWV en producción · auditoría alt/aria puntual.
- **P3**: rate limit de contadores públicos del marketplace · borrar QrFab ·
  virtualización futura · enlace mágico de login.

## 8 · Checklist de calidad (por release)

- [ ] `tsc` y `eslint` en 0 errores; build exit 0.
- [ ] Pantallas nuevas pasan CX2 §16 (checklist de pantalla) y DXS §9 (desktop).
- [ ] Journey afectado re-recorrido de punta a punta.
- [ ] Sin P0/P1 nuevos en la matriz.
- [ ] Docs actualizadas en el mismo PR (regla de sincronía).

## 9 · Roadmap priorizado de evolución

- **Etapa 1 — Conversión núcleo** (CJO 3.6–3.7): invitación post-canje,
  celebración de canje en la app del cliente, tendencias + empresas
  similares, racha de visitas con recompensa. + Barrido P2 de consistencia.
- **Etapa 2 — Gamificación y estatus** (CJO 3.8–3.9 + MEE.2): panel Admin →
  Recompensas por acción, misiones/retos sobre el motor growth, badge
  VIP/Embajador, tablero del embudo, config de experiencias con frecuencia.
- **Etapa 3 — Inteligencia** (MEE.4–.5): analíticas del Experience Engine,
  A/B de experiencias, recomendaciones personalizadas (afinidad ya
  existente → señales de canje), segmentación automática por comportamiento.
- **Etapa 4 — Expansión**: stories por empresa (MEE.3), beneficios cruzados
  entre empresas aliadas, eventos, marketplace premium, exportaciones
  (facturas PDF/email — la arquitectura FAC ya lo soporta).

## 10 · Plan por iteraciones

Cada iteración = 1 PR autocontenible con verificación completa, siguiendo
el patrón de esta sesión: **implementar → tsc/eslint/build → docs → PR**.
Orden: (1) P2 de consistencia visual [2–3 PRs por módulo] → (2) Etapa 1
[1 PR por recomendación CJO] → (3) Etapa 2 en adelante. Ninguna iteración
mezcla etapas.

## 11 · Validación de coherencia

Toda función nueva usa exclusivamente: tokens MDS (cero hex), componentes
MUK (cero componentes por página), animaciones MMS (cero keyframes ad-hoc),
y se conecta al MEE si compite por la atención del usuario (escalera de
prioridad, nunca un popup suelto). El PR que no lo cumpla no se fusiona.
