# Fase E4 — Transaction & Receipt Engine

Motor universal de transacciones + motor de comprobantes independiente.
Cada uso de membresía/promoción/beneficio genera un registro oficial
auditable con ID único, y el comprobante se construye como documento por
bloques imprimible en cualquier térmica ESC/POS (58/80 mm) o en pantalla.

## Arquitectura

```
src/lib/transactions/            Transaction Engine (motor puro, sin UI)
├── domain/types.ts              Tipos: TransactionTipo/Estado, snapshot, auditoría
├── domain/lifecycle.ts          Máquina de estados (8 estados, transiciones válidas)
├── domain/codigo.ts             TX-YYYYMMDD-NNNNNN · TCK-NNNNNN (nunca se reutilizan)
├── application/transaction-service.ts  Crear/transicionar/consultar (atómico)
├── application/analytics.ts     Métricas agregadas por empresa
└── index.ts                     API pública

src/lib/receipts/                Receipt Engine (independiente del anterior)
├── domain/types.ts              ReceiptDoc por bloques + ReceiptTemplateConfig
├── domain/builder.ts            buildReceiptDoc: datos + plantilla → documento
├── infrastructure/escpos.ts     Encoder ESC/POS estándar (58/80 mm, QR nativo)
├── infrastructure/transport.ts  Puerto PrinterTransport + registro de drivers
└── index.ts                     API pública

src/modules/transacciones/actions.ts   Acciones del panel (consulta, ticket, plantilla)
src/components/scanner/TransaccionRecord.tsx   Pantalla "historial del QR"
src/components/scanner/ReceiptTicket.tsx       ReceiptDoc → HTML imprimible
src/components/admin/ReceiptTemplateEditor.tsx Editor de plantilla + vista previa
```

## Transaction Engine

- **ID oficial**: `TX-YYYYMMDD-NNNNNN` (secuencia diaria atómica vía
  `INSERT … ON CONFLICT … RETURNING` en `transaction_counters`; sin
  colisiones bajo concurrencia, nunca se reutiliza). Número de ticket
  `TCK-NNNNNN` por empresa.
- **Estados** (8): `PENDING → VALIDATING → APPROVED → APPLIED` (camino feliz)
  y `CANCELLED`, `REVERTED` (solo desde APPLIED), `EXPIRED`, `ERROR`.
  Toda transición queda en `transaction_transitions` (quién, cuándo, motivo);
  las inválidas se rechazan (`validateTransition`).
- **Rule Engine primero**: `confirmarVisita` valida membresía/usos/QR ANTES
  de crear la transacción; el registro se crea DENTRO del mismo
  `prisma.$transaction` que invalida el QR y descuenta el uso — o se aplica
  todo, o nada (el servicio acepta `PrismaClient | TransactionClient`).
- **Snapshot congelado**: cliente, vehículo, servicio, membresía, empleado,
  sucursal, restantes… quedan copiados en la transacción (si luego cambia el
  plan o el cliente, el registro histórico no cambia).
- **Auditoría completa**: IP, dispositivo, navegador y `executionMs`
  (tiempo de atención) en cada transacción.
- **Industria-agnóstico**: el motor no conoce "car wash"; todo lo específico
  viaja en el snapshot y las plantillas.

## Historial del QR (escáner)

- El QR impreso en cada ticket codifica el **TX-ID** (no el QR de
  autenticación del cliente). Escanearlo (o escribirlo a mano) abre la
  pantalla de registro de esa operación.
- Escanear un QR de cliente **ya utilizado** ya no muestra un error seco:
  se resuelve la transacción que lo consumió (`qrTokenUsadoId` único) y se
  muestra el registro completo — estado, cliente, vehículo, empresa,
  sucursal, servicio, beneficio, promoción, membresía, empleado, caja,
  fecha/hora, TX-ID, ticket, observaciones, cancelación/reversión con motivo.
- Desde esa pantalla: **Escanear siguiente** o **Reimprimir** (auditado).

## Receipt Engine

- **Documento por bloques** (`ReceiptDoc`): encabezado / cliente / servicio /
  QR / pie. El builder es puro: `datos + plantilla → documento`; la salida es
  intercambiable (pantalla + `window.print` hoy; ESC/POS por bytes; PDF/email/
  WhatsApp en el futuro sin tocar el motor).
- **ESC/POS estándar** (sin comandos propietarios): `ESC @`, `ESC a`, `ESC E`,
  `GS !`, QR nativo `GS ( k`, corte `GS V`. Columnas 32 (58 mm) / 48 (80 mm).
  Compatible con 2Connect POS80-01 V8 y cualquier térmica estándar.
- **Transports**: puerto `PrinterTransport` con registro de drivers
  (usb/serial/bluetooth/ethernet/wifi/browser). Incluido: WebUSB genérico
  (clase impresora). El canal activo hoy es `browser` (render HTML +
  `window.print`, funciona con la térmica instalada como impresora del
  sistema); ethernet/wifi requerirán agente local o endpoint.
- **Reimpresiones**: cada impresión se registra en `receipt_prints`
  (empleado, fecha/hora, motivo, número). La copia N>1 se imprime con banner
  `COPIA #N` y queda en el audit log (`COMPROBANTE_IMPRESO`).

## Plantilla por empresa (sin código)

`receipt_templates.config` (JSON) editable en **Perfil → Comprobante impreso**:
ancho de papel (58/80), logo, RNC, líneas extra de encabezado, campos
visibles (vehículo, puntos, nivel, promoción, beneficio, totales, QR, promos
activas), mensaje de pie, web, redes, políticas, próxima visita y **orden de
los bloques**. La vista previa se genera con el mismo `buildReceiptDoc` que
imprime el ticket real. Guardado saneado en servidor (whitelist) y auditado
(`PLANTILLA_RECIBO_ACTUALIZADA`).

## Analytics (Reportes admin)

Bloque "Transacciones (últimos 30 días)": volumen total, promedio diario y
mensual, aplicadas, canceladas/revertidas, errores, reimpresiones, tiempo
promedio de atención (`executionMs`) y tops de servicios, empleados,
promociones y beneficios (agregación sobre el snapshot JSON).

## Migración

- Prisma: `prisma/migrations/20260738_add_transaction_receipt_engine/`
- Supabase (editor SQL, idempotente):
  `scripts/supabase-20260738-transaction-receipt-engine.sql`
  → al final imprime 12 filas de verificación; todas deben decir `OK`.

## Checklist de validación E4

- [ ] Ejecutar el SQL 20260738 en Supabase (12 OK).
- [ ] Confirmar un uso en el escáner → el comprobante muestra `TX-…` y `TCK-…`.
- [ ] Imprimir el ticket → QR al pie + datos de la empresa; el diseño responde
      a la plantilla configurada en Perfil.
- [ ] Volver a escanear el QR del cliente ya usado → pantalla de registro
      completo (no error seco).
- [ ] Escanear/teclear el código `TX-…` del ticket → misma pantalla de registro.
- [ ] Reimprimir desde esa pantalla → pide motivo, imprime con banner `COPIA #N`
      y suma en `receipt_prints` / audit log.
- [ ] Cliente → Historial: cada visita muestra su TX-ID y ticket.
- [ ] Admin → Reportes: aparece el bloque de transacciones con métricas.
- [ ] Admin → Perfil: editar plantilla (p. ej. 58 mm + quitar puntos) y ver el
      cambio en la vista previa y en el próximo ticket.

## Extensión futura (sin tocar el motor)

- Nuevos tipos de operación: usar `TransactionTipo` existente
  (`PROMOTION_USE`, `COUPON_USE`, `POINTS_SPEND`, …) y llamar
  `crearTransaccionAplicada` dentro del `$transaction` del caso de uso.
- Nuevos canales de impresión: `registerTransport(kind, factory)`.
- PDF/email/WhatsApp: consumir el mismo `ReceiptDoc` con otro renderer.
