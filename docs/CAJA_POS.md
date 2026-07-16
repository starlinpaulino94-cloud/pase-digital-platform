# MembeGo · Caja (POS) y pagos presenciales

Sistema de cobros en sucursal con trazabilidad completa, construido SOBRE la
arquitectura existente (no en paralelo): órdenes = `Membership` /
`ProductoCompra` con sus transiciones inmutables; cobros = `Transaction`
(código TX + ticket únicos, snapshot congelado, transiciones); auditoría =
`AuditLog` (insert-only). Preparado para pasarelas y terminales futuras
(`MetodoCobroTipo.OTRO`, `TransactionTipo.SALE`).

## Fase 1 (entregada)

### Esquema (`scripts/supabase-20260747-caja-pos.sql`)
| Pieza | Qué añade |
|---|---|
| `caja_sesiones` | Sesión de caja por sucursal: estado ABIERTA/CERRADA, responsable (abre/cierra), turno, balance inicial/final/esperado, **diferencia** de arqueo, observaciones, fechas. Nunca se elimina. |
| `transactions` | `cajaSesionId`, `monto`, `metodoCobro` (EFECTIVO/TRANSFERENCIA/OTRO) → arqueo y reportes. |
| `memberships` / `producto_compras` | `referencia` única (ORD-XXXXXX) + `sucursalPagoId` (dónde pagará el cliente). |
| `AuditAccion` | `CAJA_ABIERTA`, `CAJA_CERRADA`, `COBRO_REGISTRADO`. |

### Flujo del cliente
1. Elige **"Pagaré en la sucursal"** al pagar un plan (o cambio de plan).
2. Si hay varias sucursales, elige en cuál pagará.
3. Recibe una **referencia única** (`ORD-XXXXXX`) para mostrar en caja.
4. No recibe el beneficio hasta que el cobro se confirme.

### Flujo del empleado (`/empleado/caja`)
1. **Abrir caja**: sucursal + efectivo inicial + turno. Una caja abierta por
   sucursal; sin caja abierta **no se puede cobrar**.
2. **Buscar la orden**: referencia, nombre, teléfono o correo (cola de
   pendientes si no busca nada). Une membresías, cambios de plan y compras
   de promoción.
3. **Cobrar en 2 toques**: forma de pago (efectivo/transferencia/otro) +
   observaciones → confirma el monto.
4. Al confirmar, automáticamente:
   - activa la membresía o la promoción (punto de activación único:
     `activarMembresia` / `activarCompraPromocion` → genera el QR, aplica
     cambio de plan, registra historial y recompensas de referidos);
   - crea la **Transaction SALE** (empleado, sucursal, caja, monto, método,
     observaciones, IP/dispositivo, snapshot congelado, ticket);
   - registra `COBRO_REGISTRADO` en la auditoría;
   - notifica al cliente ("Pago recibido en sucursal").
5. **Resumen del turno**: cobros, efectivo, transferencias, total y últimos
   cobros en vivo.
6. **Cerrar caja**: cuenta el efectivo → el sistema congela el esperado
   (inicial + efectivo del turno) y la **diferencia** (faltante/sobrante).

### Seguridad
- Solo staff `SCANNER_ROLES` de la MISMA empresa (multi-tenant en cada query).
- Cobros bloqueados con caja cerrada; cierre con guard atómico.
- Anti doble-cobro: la activación rechaza estados ya activos.
- Nada se borra: sesiones, transacciones, transiciones y auditoría son
  permanentes; los cambios son solo de estado.

## Fases siguientes (diseñadas, pendientes)

- **F2 · Reportes admin**: ventas por sucursal/caja/empleado/fecha/plan/
  promoción, pagos y transferencias pendientes, exportación. Fuente:
  `Transaction` (SALE) agregada por `cajaSesionId`/`sucursalId`/`empleadoId`.
- **F3 · Timeline del cliente**: línea de tiempo cronológica en la ficha
  (cliente creado → compró → pagó → QR generado → escaneado → consumido →
  renovó → invitó → ganó). Fuente: unión de `AuditLog` + `Transaction` +
  `ProductoCompraTransicion` + `ReferralEvent` — los datos YA existen.
- **F4 · Estados extendidos del QR**: el ciclo actual (generado/activo/
  usado + regeneración) ya queda auditado vía `QrToken` + `Transaction` +
  `AuditAccion.QR_*`; se añadirán BLOQUEADO/FRAUDE con reglas del
  anti-abuso y registro de escaneos rechazados.
- **F5 · Cancelación de cobros con permisos** (REVERTED en Transaction) y
  reembolsos.
- **F6 · Compras de promoción con pago presencial** desde la app del cliente
  (hoy la promo se cobra en caja buscándola; falta el botón "pagaré en
  sucursal" en el flujo de compra de promos, análogo al de planes).

## Operativa para el negocio

1. Ejecutar `scripts/supabase-20260747-caja-pos.sql` en Supabase (idempotente).
2. Crear las sucursales en **Admin → Sucursales** (ya existía).
3. El empleado abre su caja en **Empleado → Caja** cada turno.
