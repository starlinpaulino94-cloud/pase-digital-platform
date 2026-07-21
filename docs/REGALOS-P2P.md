# Regalos y transferencias entre usuarios (P2P) — Investigación y plan

> **Estado:** investigación aprobable. Nada de esto está implementado aún; se
> ejecutará por fases (R1–R4) cuando el negocio dé el visto bueno.

## 1. Qué se pide

1. **Regalar** una membresía, promoción o lavado a OTRO usuario de MembeGo,
   buscándolo por su nombre o su ID dentro de la app.
2. **Transferir** usos propios (p. ej. "te paso 2 de mis 4 lavados") a otro
   usuario.
3. Un **módulo que gestione todo esto**: enviar, recibir, aceptar, historial.

## 2. Maquinaria existente que se reutiliza (casi todo ya existe)

| Pieza | Dónde vive | Rol en regalos P2P |
|---|---|---|
| **Wallet del cliente** | `ProductoCompra` (usosIncluidos/usosRestantes, estado ACTIVA) | Es EL contenedor del beneficio. Un regalo aceptado = una compra ACTIVA en la wallet del receptor. |
| **Usos de membresía** | `Membership.lavadosRestantes` | Fuente de la transferencia de lavados de un plan. |
| **Canje en mostrador** | `confirmarCanjePromocion` (QR + Transaction) | El receptor canjea su regalo con el MISMO flujo de siempre. Cero cambios. |
| **Comprobantes** | Transaction Engine (G3: toda entrega genera comprobante) | Cada regalo/transferencia deja Transaction + comprobante imprimible para ambas partes. |
| **Identidad corta** | `Cliente.codigoCorto` (@unique, ya existe para /r/XXXXXX) | Base del "ID MembeGo" para encontrar al destinatario sin exponer datos. |
| **Notificaciones** | `crearNotificacion` | "Te llegó un regalo de Juan 🎁" con link a aceptar. |
| **Celebración** | `/cliente/celebracion` (confeti + "Reclamar ahora") | Pantalla que ve el receptor al aceptar. |
| **Pagos** | Flujo de pagos existente (transferencia/sucursal + validación admin) | Para regalar algo NUEVO (pagado), paga el regalador con el flujo de siempre. |
| **Anti-abuso** | rate-limit distribuido + AuditLog + huella IP | Límites de envío y trazabilidad completa. |

**Conclusión clave:** no hay que inventar un sistema de beneficios paralelo.
El regalo es un **sobre** (`Regalo`) que, al aceptarse, usa la maquinaria
actual para mover o crear el beneficio.

## 3. Decisiones de diseño (recomendaciones)

### 3.1 Cómo se encuentra al destinatario
- **Buscar por nombre exacto es mala idea a secas**: homónimos, privacidad
  (enumerar clientes), errores de destinatario.
- Recomendado: **ID MembeGo** (el `codigoCorto` existente, mostrado en el
  perfil como `@ABC123` con botón copiar/compartir + QR) **y además** un
  buscador dentro de la MISMA empresa que acepta nombre/teléfono/correo pero:
  - exige mínimo 4 caracteres, con rate-limit,
  - devuelve máximo 5 resultados **enmascarados** (nombre + iniciales del
    apellido + últimos 4 del teléfono + avatar), nunca listas completas,
  - y SIEMPRE muestra una tarjeta de confirmación ("¿Es esta persona?") antes
    de enviar.
- El regalo también puede enviarse a un **teléfono/correo que aún no está en
  MembeGo**: queda PENDIENTE y se reclama al registrarse (reutiliza el flujo
  `?next=` ya implementado — el registro aterriza en "Reclamar mi regalo").

### 3.2 El regalo nunca se aplica solo: se ACEPTA
Estado `PENDIENTE` → el receptor recibe notificación → **acepta o rechaza**
(72 h de vigencia, configurable). Motivos: evitar spam, errores de
destinatario, y que el receptor controle su wallet. Si expira o se rechaza,
los usos vuelven íntegros al remitente.

### 3.3 Qué se puede regalar/transferir (3 tipos)
1. **TRANSFERENCIA_USOS**: mover N usos de una compra ACTIVA propia (o de los
   lavados de la membresía, si el negocio lo permite) a otro usuario de la
   misma empresa. Al aceptar: se descuentan del remitente (atómico, guard
   `usosRestantes >= N`) y se crea/incrementa una compra espejo en el
   receptor con la misma promoción de origen.
2. **REGALO_COMPRA**: comprar una promoción PARA otro usuario. Paga el
   regalador con el flujo de pagos normal; el campo nuevo
   `beneficiarioClienteId` hace que la compra activada aterrice en la wallet
   del receptor.
3. **REGALO_MEMBRESIA**: igual, pero con un plan. La membresía se crea a
   nombre del receptor (`beneficiarioClienteId`) y sigue el flujo de
   pago/validación de siempre.

### 3.4 Control del negocio (por empresa)
Toggle y política en la config de la empresa:
- `permitirTransferencias` (on/off) y `permitirRegalos` (on/off).
- `maxTransferenciasMes` por cliente (default 3) y `minUsosTransferibles`.
- Transferencias solo dentro de la MISMA empresa (los usos son de esa
  empresa; cross-empresa no tiene sentido económico).
- Por plan/promoción: flag `transferible` (default true) para excluir
  promos 1-por-cliente o de bienvenida (anti-farmeo de regalos de campaña:
  los beneficios ganados en campañas/ruleta/bienvenida nacen NO transferibles).

### 3.5 Contabilidad y trazabilidad
- Cada aceptación genera **2 Transactions** (BENEFIT_USE saliente con monto 0
  "Transferencia a @X" en el remitente; entrega entrante en el receptor) →
  comprobantes reimprimibles para ambos, visibles en `/admin/registros`.
- `AuditLog` en enviar/aceptar/rechazar/expirar, con IP y userAgent.
- El admin ve el módulo completo (quién regaló qué a quién) en su panel.

## 4. Modelo de datos propuesto (Fase R1)

```prisma
enum RegaloTipo { TRANSFERENCIA_USOS  REGALO_COMPRA  REGALO_MEMBRESIA }
enum RegaloEstado { PENDIENTE  ACEPTADO  RECHAZADO  EXPIRADO  CANCELADO }

model Regalo {
  id            String       @id @default(cuid())
  companyId     String
  tipo          RegaloTipo
  estado        RegaloEstado @default(PENDIENTE)
  // Partes
  remitenteId   String       // Cliente que envía
  destinatarioId String?     // Cliente receptor (null si aún no existe)
  destinatarioContacto String? // tel/correo si el receptor no está en MembeGo
  // Contenido
  compraOrigenId String?     // TRANSFERENCIA_USOS: de qué compra salen
  membershipOrigenId String? // TRANSFERENCIA_USOS de lavados del plan
  promocionId   String?      // REGALO_COMPRA
  planId        String?      // REGALO_MEMBRESIA
  usos          Int          @default(1)
  mensaje       String?      // dedicatoria visible para el receptor
  // Resultado al aceptar
  compraDestinoId String?    // compra creada en la wallet del receptor
  membershipDestinoId String?
  txRemitenteId String?      // comprobantes
  txDestinatarioId String?
  expiraAt      DateTime
  createdAt     DateTime @default(now())
  resueltoAt    DateTime?
  @@index([destinatarioId, estado])
  @@index([remitenteId])
  @@index([companyId, createdAt])
}
```
Más: `ProductoCompra.beneficiarioClienteId?` y `Membership.beneficiarioClienteId?`
(quién lo recibe cuando pagador ≠ beneficiario), `Cliente` ya tiene
`codigoCorto`. Config en la empresa (JSON o columnas) para §3.4.

## 5. Flujo UX completo

**Enviar** (nuevo módulo cliente `/cliente/regalos`):
1. Entrada desde: "Mis beneficios" (botón *Transferir* en cada compra con
   usos > 1), detalle de promoción (*Regalar esta promo*), planes (*Regalar
   este plan*), o directo en `/cliente/regalos` → *Enviar regalo*.
2. Paso 1 — destinatario: pega `@ID`, escanea QR del amigo, o busca (§3.1) →
   tarjeta de confirmación con avatar/nombre enmascarado.
3. Paso 2 — contenido: qué y cuántos usos + dedicatoria opcional.
4. Paso 3 — resumen y confirmar. Si es compra/membresía nueva → continúa al
   flujo de pago normal (el regalo queda vinculado a esa orden y se entrega
   cuando el pago se valida).
5. Estado visible en "Enviados" (pendiente/aceptado/…), con cancelar mientras
   esté pendiente.

**Recibir**:
1. Notificación + badge en `/cliente/regalos` ("Recibidos").
2. Pantalla del regalo: de quién, qué, dedicatoria → **Aceptar** / Rechazar.
3. Al aceptar → confeti (`/cliente/celebracion`) → "Reclamar mi lavado ahora"
   → detalle en Mis beneficios con su QR de canje de siempre.
4. Receptor sin cuenta: link/WhatsApp → registro con `?next=` → aterriza
   directo en aceptar su regalo.

**Admin** (`/admin/regalos` o pestaña en Registros): listado con filtros,
métricas (enviados/aceptados/expirados), y los comprobantes ya salen en
`/admin/registros`.

## 6. Anti-abuso (imprescindible antes de abrir P2P)

- Rate-limit: máx. N envíos/día por cliente + límite mensual configurable.
- Beneficios de campaña/bienvenida/ruleta: `transferible=false` de origen
  (evita crear cuentas para farmear lavados gratis y consolidarlos).
- Transferencia atómica con `updateMany` + guard de saldo (sin dobles gastos
  con clics concurrentes).
- Todo auditado; el admin puede cancelar un regalo pendiente.

## 7. Fases de implementación

**R1 — Identidad + esquema (base)** — ✅ *Hecha.*
ID MembeGo visible en el perfil (@codigoCorto + QR + copiar), buscador seguro
de destinatarios (server action con máscara + rate-limit), esquema `Regalo` +
`beneficiarioClienteId` + config de empresa + migración SQL idempotente.

> **✅ R1 implementada:**
> - **Esquema**: enums `RegaloTipo`/`RegaloEstado` + modelo `Regalo` (partes,
>   contenido, resultado, expiración) con relaciones a Cliente/Company;
>   `beneficiarioClienteId` en `producto_compras` y `memberships`;
>   `companies.regalosConfig` (JSON). Migración idempotente
>   `prisma/migrations/20260752_regalos_p2p/` — **ejecutarla en Supabase**.
> - **Config**: `src/modules/regalos/config.ts` (`getRegalosConfig`) con
>   defaults §3.4 (transferencias/regalos on, 3/mes, 72 h).
> - **Buscador seguro**: `buscarDestinatario()` en
>   `src/modules/regalos/actions.ts` — solo clientes de la MISMA empresa,
>   @código exacto o texto ≥4 chars, máx. 5 resultados ENMASCARADOS (nombre +
>   inicial, •••últimos 4 del teléfono), excluye al propio usuario y
>   rate-limit 10/min. `obtenerMiIdMembego()` genera el @ID si no existe.
> - **UI**: tarjeta **"Mi ID MembeGo"** en `/cliente/perfil` (@código en
>   grande + QR + copiar + compartir nativo), con degradación si la BD aún no
>   está migrada. Verificado con tsc, eslint y `next build`.

**R2 — Transferir usos (el corazón)** — ✅ *Hecha.*
Botón *Transferir* en Mis beneficios, flujo enviar→aceptar/rechazar/expirar,
módulo `/cliente/regalos` (enviados/recibidos), notificaciones, comprobantes
(2 Transactions), celebración del receptor, límites anti-abuso.

> **✅ R2 implementada:**
> - **Acciones** (`src/modules/regalos/actions.ts`): `enviarTransferencia`
>   (reserva ATÓMICA de usos al enviar con guard de saldo; valida config de
>   empresa, límite mensual, destinatario de la misma empresa, anti-farmeo
>   —solo compras con `precioCongelado > 0`— y, para lavados del plan,
>   membresía activa del receptor), `responderRegalo` (aceptar crea compra
>   ESPEJO en la wallet del receptor —hereda promoción/precio/vencimiento, el
>   canje QR funciona sin cambios— o suma lavados a su membresía; rechazar/
>   expirar devuelve los usos; guards atómicos con deshacer), `cancelarRegalo`.
> - **Comprobantes**: al aceptar se emiten 2 Transactions (`BENEFIT_USE`, via
>   `registrarEntregaBeneficio`) — comprobante reimprimible para cada parte,
>   visibles en `/admin/registros`.
> - **Expiración perezosa** (sin cron): al listar o responder, los pendientes
>   vencidos pasan a EXPIRADO y devuelven usos (`expirarPendientesVencidos`).
> - **UI**: módulo `/cliente/regalos` (Recibidos con Aceptar/Rechazar +
>   Enviados con Cancelar, dedicatorias, chips de estado y expiración) y
>   `/cliente/regalos/enviar` (3 pasos: destinatario @ID/búsqueda con
>   confirmación → fuente wallet o lavados del plan + cantidad → dedicatoria).
>   Entrada "Regalos" en el menú del cliente y botón **"Transferir a un
>   amigo"** en Mis beneficios. Aceptar lleva a `/cliente/celebracion`
>   ("Reclamar mi X ahora"). Notificaciones a ambas partes en cada paso.
>   Verificado con tsc, eslint y `next build`.

**R3 — Regalar compra/membresía nueva (pagada)** — ✅ *Hecha.*
`beneficiarioClienteId` en el checkout de promos y planes ("¿Es un regalo?"),
entrega al validarse el pago, dedicatorias.

> **✅ R3 implementada:**
> - **Regalar promoción** (`regalarPromocion`): la compra se crea bajo el
>   COMPRADOR con `beneficiarioClienteId` — así usa el flujo de pago existente
>   completo (transferencia con comprobante, referencia POS, caja) sin
>   cambios. Valida ventana/cupo, promos privadas (membresía del amigo),
>   `limitePorCliente` del BENEFICIARIO y bloquea promos gratis (esas se
>   reclaman directo). Al validarse el pago, `activarCompraPromocion` reasigna
>   la compra a la wallet del amigo ANTES de activar (QR y notificación le
>   llegan a él; la factura sale a nombre de quien pagó) y resuelve el Regalo.
> - **Regalar membresía** (`regalarMembresia`): se crea a nombre del AMIGO
>   (los lavados viven en su plan) con referencia POS única; el regalador paga
>   en sucursal o por transferencia citando la referencia y el admin/caja la
>   confirma como cualquier pago (aviso a admins con la referencia). Guards:
>   amigo sin membresía ACTIVA ni solicitud en curso. `activarMembresia`
>   resuelve el Regalo y notifica a ambos.
> - **Hooks de entrega** (`src/modules/regalos/entrega.ts`):
>   `entregarCompraABeneficiario` + `resolverRegaloPagado` — nunca rompen la
>   activación; PENDIENTE→ACEPTADO con notificaciones 🎁 a las dos partes.
> - **UI**: `/cliente/regalos/regalar` (elegir promo/plan con precio →
>   destinatario @ID/búsqueda enmascarada → dedicatoria). Promoción → sigue al
>   pago de la compra; membresía → pantalla con la referencia en grande y
>   copiar. Botón "Regalar promo o membresía" en el módulo Regalos.
>   *Receptor sin cuenta (contacto externo): pospuesto a R4.* Verificado con
>   tsc, eslint y `next build`.

**R4 — Gestión y crecimiento** — ✅ *Hecha.*
Vista admin con métricas, cancelación admin, recordatorio automático de
regalos por expirar (automatizaciones), y regalos a personas SIN cuenta
(reclamo automático al registrarse).

> **✅ R4 implementada:**
> - **Vista admin `/admin/regalos`** (`getRegalosAdmin`): KPIs del programa
>   (totales, pendientes, aceptados, tasa de aceptación) + listado de quién
>   regaló qué a quién con filtros por tipo y estado. Sección `regalos` en
>   `ADMIN_SECTIONS` (solo admin pleno, fail-closed) y entrada "Regalos P2P"
>   en el grupo Clientes del menú.
> - **Cancelación admin** (`cancelarRegaloAdmin`): cancela un PENDIENTE con
>   motivo obligatorio, devuelve los usos reservados al remitente y notifica a
>   ambas partes. Para regalos pagados, la orden pendiente se gestiona además
>   desde Pagos.
> - **Mantenimiento en el cron** (`mantenimientoRegalos`, colgado de
>   `/api/cron/automatizaciones`): expira GLOBALMENTE los pendientes vencidos
>   (la expiración perezosa de R2 queda como respaldo) devolviendo los usos, y
>   envía un recordatorio ⏰ al destinatario cuando la transferencia expira en
>   menos de 24 h (deduplicado por notificación dentro de la ventana).
> - **Receptor SIN cuenta**: `enviarTransferencia` acepta `destinatarioContacto`
>   (correo o teléfono ≥7 dígitos, normalizados); si el contacto ya es cliente
>   del negocio, el regalo va directo a su cuenta. Solo usos de wallet (los
>   lavados del plan exigen membresía activa). Al registrarse con ese correo o
>   teléfono, `vincularRegalosPorContacto` (enganchado en ambos caminos del
>   registro) le asigna los regalos pendientes no vencidos y notifica a ambas
>   partes. UI: enlace "¿No está en MembeGo? Envíaselo a su teléfono o correo"
>   en el formulario de envío. Sin cambios de esquema (usa
>   `destinatarioContacto` de la migración 20260752).
> - Pendiente opcional (no pedido): "gift cards" de monto abierto.
>   Verificado con tsc, eslint y `next build`.

## 8. Decisiones del negocio — ✅ CONFIRMADAS (2026-07-21)

1. **Lavados de membresía: SÍ se transfieren** (además de la wallet). Regla
   técnica: como los lavados del plan viven en la membresía, el receptor debe
   tener una **membresía activa** para recibirlos (se validan al enviar y al
   aceptar); si no la tiene, se le sugiere transferir usos de wallet.
2. Vigencia del regalo pendiente: **72 h** ✔ (configurable por empresa).
3. Regalos pagados (R3): **transferencia Y pago en sucursal** ✔.
4. Límite mensual: **3 transferencias/cliente** ✔ (configurable).
