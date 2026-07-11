# Fase E6 — Referral Engine: reconstrucción sobre eventos reales

Diagnóstico previo: `docs/FASE_E6_AUDITORIA_REFERIDOS.md` (10 causas raíz con
evidencia). Esta reconstrucción las elimina; ninguna métrica usa valores
aproximados, todo proviene de eventos registrados y **cada dato tiene su query
de auditoría** en `scripts/verificar-referidos.sql`.

## Attribution Tracking (mejora obligatoria)

- Cada visitante recibe un identificador anónimo (`visitorId`, cookie `mg_vid`)
  sembrado en el clic de `/r/[code]` y propagado hasta el registro.
- El event store `referral_events` enlaza cada evento al visitante y al
  referido (`referidoClienteId`) → recorrido completo por persona:
  `LINK → SHARE → CLICK → REGISTRO_INICIADO → REGISTRO → VERIFICADO →
  COMPRA/MEMBRESIA → RECOMPENSA` (y `FRAUDE` cuando el antifraude actúa).
- `getReferidoTimeline(referidoClienteId)` reconstruye la línea de tiempo,
  incluidos los clics del visitante ANTES de tener cuenta.

## Embudo (una fuente por etapa, tasas entre etapas adyacentes)

`Links → Clics → Visitantes únicos → Registros iniciados → Registros
completados → Verificados → Compras → Referidos válidos → Recompensas`.

- **Visitantes únicos** = `COUNT(DISTINCT visitorId)` de clics (antes se
  contaban hits: hasta 5/IP/hora).
- **Conversión** = referidos válidos / registros (mismo universo). La antigua
  "membresías/clics" mezclaba filas con eventos y quedó eliminada.
- Registros y conversiones salen SIEMPRE de filas `referidos` legítimas
  (`sospechoso = false`); los sospechosos se reportan aparte.

## Antifraude en TODAS las etapas

| Validación | Mecanismo |
|---|---|
| Auto-referido | por persona (`supabaseId`), y el dueño no genera clics propios con sesión |
| Huella de red repetida | hash de IP (7 días) → `sospechoso` |
| Duplicidad de cuentas | mismo `visitorId` con >1 registro en 30 días → `sospechoso` (aunque rote la red) |
| Conversión de sospechosos | BLOQUEADA (antes completaban, puntuaban y empujaban recompensas) + evento `FRAUDE` |
| Recompensas | solo referidos legítimos; entrega única por regla (unique referente+regla) |
| Bots/preview | filtro de user-agents en el clic; rate limit 5 clics/IP/hora |

## Recompensas reales (`referral_recompensas`)

- Umbral `>=` (la igualdad exacta anterior perdía recompensas si el conteo
  saltaba el número).
- Estados: `PENDIENTE` (descuentos o usos sin membresía activa donde
  aplicarlos) / `ENTREGADA` / `RECHAZADA` — "recompensas pendientes" es un
  dato real, no un mensaje.
- Cada entrega genera: **transacción oficial** (Transaction Engine, tipo
  `REFERRAL`, con TX-ID auditable), evento `RECOMPENSA`, `auditLog`
  RECOMPENSA_OTORGADA y notificación.

## Conversión multi-vía

`procesarReferidoCompletado` vive en los puntos de activación únicos:
`activarMembresia` (membresías, cualquier caller) y `activarCompraPromocion`
(promociones E5). La PRIMERA compra confirmada convierte al referido. Además
ahora se emite `referido.convirtio` al bus de automatizaciones (antes el
journey solo recibía el registro).

## Dashboards

- **Cliente**: embudo personal con tasas, conversión honesta, recompensas con
  estado, retos con logro verificable, ranking por conversiones reales (los
  puntos quedan como gamificación, ya no ordenan el ranking).
- **Admin**: embudo de 9 etapas, visitantes únicos, verificados, clientes
  activos, compras, ingresos SOLO de legítimos, valor promedio por referido,
  tiempo promedio a conversión, recompensas entregadas/pendientes,
  sospechosos/fraudes, canal con conversión real (join clic↔registro por
  visitante), campañas, últimos movimientos (eventos reales) y estado de cada
  referido. KPI del superadmin corregido (excluye sospechosos).

## Integraciones

Transaction Engine (recompensas con TX-ID) · Notification Engine (in-app) ·
Automation Engine (`referido.invitado_registrado` + `referido.convirtio`) ·
Analytics (embudo/canales/campañas desde el event store) · Reward Engine
(`ReglaRecompensa` + `referral_recompensas`). El motor universal Fase D
permanece latente y sin datos: NO se cableó (cero filas, riesgo alto); el
event store vivo ES la arquitectura basada en eventos.

## Pruebas

- `npm test` → `tests/referidos-e6.test.ts` (12 pruebas de lógica pura:
  catálogo de eventos, antifraude de huella, umbral `>=` de recompensas,
  niveles, ciclo de compra usado por la conversión).
- Escenarios con datos (clic, varios clics, registro, conversión, fraude,
  recompensa, rechazo): `scripts/verificar-referidos.sql` — cada métrica del
  dashboard con su query fuente + 3 checks de consistencia que deben devolver
  0 filas.

## Migración

- Prisma: `prisma/migrations/20260740_add_referral_attribution_engine/`
- Supabase (idempotente): `scripts/supabase-20260740-referral-attribution-engine.sql`
  → verificación de 10 filas OK.

## Criterios de aceptación (estado)

- [x] Sin datos simulados (auditoría: nunca los hubo; lo roto eran las fuentes).
- [x] Métricas de una sola fuente por etapa, exactas y auditables por SQL.
- [x] Clics de eventos reales; visitantes únicos reales (visitorId).
- [x] Conversiones exactas (mismo universo) y multi-vía.
- [x] Recompensas calculadas con umbral `>=`, registro propio y TX-ID.
- [x] Dashboard confiable (embudo, tendencias, ranking, movimientos, estados).
- [x] Timeline por referido con fecha y hora.
- [x] Antifraude activo en registro, conversión y recompensa.
- [ ] Ejecutar SQL 20260740 en Supabase (10 OK) — paso del operador.
- [ ] Validar en producción con `scripts/verificar-referidos.sql`.
