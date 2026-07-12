# Fase E5 — Promotion Subscription & Purchase Engine

Las promociones dejan de ser solo marketing: son **productos comerciales** que
el cliente adquiere, paga, activa y consume con la MISMA arquitectura que las
membresías. No hay flujo paralelo: se reutilizan el ciclo de pago por
transferencia, el sistema de QR de un solo uso, el Transaction Engine (E4), el
Receipt Engine, las notificaciones, la auditoría y el bus de estrategias.

## Ciclo de vida implementado

```
Empresa publica promoción (esComprable + precio)
  → Cliente la ve (marketplace / panel)
  → «Adquirir» → ProductoCompra SOLICITADA → PENDIENTE_PAGO
  → Cliente ve cuentas (MetodoPago) + instrucciones (puerto de pagos)
  → Sube comprobante (bucket `comprobantes`) + fecha/hora declarada + nota
  → EN_VALIDACION → notificación a admins (/admin/pagos)
  → Admin aprueba → activarCompraPromocion (punto único)
      · cupo atómico contra maxCanjes (canjes = ventas activadas)
      · ACTIVA + fechaVencimiento del beneficio + usosRestantes
      · QR único (qr_tokens.compraId) — MISMO sistema que membresías
      · auditoría PAGO_APROBADO/QR_GENERADO + notificación + eventos
  → Cliente canjea en el escáner → Transaction Engine (PROMOTION_USE)
      · QR invalidado + uso descontado + ticket del Receipt Engine
      · quedan usos → QR regenerado · sin usos → CONSUMIDA
  → EXPIRADA (lazy al escanear/vencer) · RECHAZADA (reintento) · CANCELADA
```

Cada cambio de estado queda en `producto_compra_transiciones` (quién, cuándo,
por qué) — visible para el cliente como línea de tiempo en su compra.

## Estados (enum CompraEstado)

`SOLICITADA · PENDIENTE_PAGO · EN_VALIDACION · APROBADA · ACTIVA · RECHAZADA ·
CONSUMIDA · EXPIRADA · CANCELADA` — "Disponible" es estado de la promoción
(publicada/ventana abierta), no de una compra. "Comprobante enviado" y
"Pendiente de validación" se unifican en `EN_VALIDACION` (el comprobante es lo
que abre la validación).

## Vigencias independientes

1. **Ventana de adquisición** = `vigenciaDesde/vigenciaHasta` de la promoción
   (cuándo puede comprarse) + cupo `maxCanjes`.
2. **Vigencia del beneficio** = `beneficioVigenciaDias` (desde la activación)
   O `beneficioVigenciaHasta` (fecha fija); ambos vacíos = sin vencimiento.

`validarVentanaAdquisicion` valida (1) al solicitar; `validarConsumoCompra`
valida (2) + estado + usos + **días permitidos** + **horario** (zona horaria
de la empresa) al escanear y otra vez dentro del canje atómico.

## Imágenes por archivo

- Bucket dedicado **`promociones`** (público, 5 MB, JPG/PNG/WebP) — creado por
  el SQL de esta fase con sus políticas.
- `PromoImagenUpload` en el editor: subir/cambiar/quitar desde el dispositivo;
  la URL del storage se guarda en `imagenUrl` (sin URLs externas).
- Galería futura preparada: columna `promociones.imagenes[]`.

## Pago desacoplado (src/lib/payments)

Puerto `PaymentProvider` con registro: `iniciar(ctx) → PaymentIntent`
(`manual_comprobante` hoy; `redirect` reservado para pasarelas). Proveedor
inicial: `TRANSFERENCIA`. Stripe/Azul/CardNET/PayPal/Apple Pay/Google Pay se
agregan registrando un provider — el flujo principal y el punto de activación
(`activarCompraPromocion`) no cambian: una pasarela con webhook llama al mismo
punto de activación que hoy usa el admin.

## Mejora obligatoria: Productos Comerciales (análisis y decisión)

**Decisión: unificación INCREMENTAL a nivel de servicio + tabla genérica de
compras**, no refactor destructivo del modelo `Membership` en producción.

- `producto_compras` es genérica: `tipo ProductoComercialTipo (PROMOCION |
  MEMBRESIA)` + referencia al producto. Hoy la usan las promociones; las
  membresías pueden migrar su ciclo de compra a esta tabla sin rediseño (el
  enum y las FKs ya lo contemplan).
- Lo COMPARTIDO ya es una sola pieza: cuentas `MetodoPago`, bucket
  `comprobantes`, patrón comprobante→validación, punto de activación único
  (espejo `activarMembresia` ↔ `activarCompraPromocion`), `qr_tokens` (con
  `membresiaId` O `compraId`), escáner, Transaction Engine, Receipt Engine,
  notificaciones y auditoría.
- Lo ESPECÍFICO queda por tipo: renovación periódica y `lavadosRestantes` en
  membresías; ventana de compra, usos por compra y restricciones de canje en
  promociones. Un tipo nuevo (paquetes, giftcards, eventos) = nueva variante
  de `tipo` + sus reglas, sin tocar los motores.
- Por qué no una entidad base en BD hoy: `Membership` tiene datos vivos,
  unique(clienteId, companyId), renovaciones y 30+ consumidores; migrarla en
  esta fase multiplicaría el riesgo sin ganar capacidades. La tabla genérica
  entrega el mismo beneficio arquitectónico con riesgo cero para producción.

## Piezas principales

| Pieza | Ruta |
|---|---|
| Dominio compras (transiciones, ventana, consumo) | `src/modules/promociones/compra.ts` |
| Acciones cliente (solicitar/comprobante/cancelar) | `src/modules/promociones/compraActions.ts` |
| Canje atómico + Transaction Engine + ticket | `src/modules/promociones/canjeActions.ts` |
| Punto de activación único | `src/modules/pagos/activacionCompra.ts` |
| Acciones admin (aprobar/rechazar) | `src/modules/admin/compraActions.ts` |
| Puerto de pagos | `src/lib/payments/index.ts` |
| Subida de imagen | `src/components/admin/PromoImagenUpload.tsx` |
| CTA de compra | `src/components/cliente/ComprarPromoButton.tsx` |
| Mis promociones (lista + detalle con QR/pago/timeline) | `src/app/(cliente)/cliente/mis-promociones/` |
| Canje en escáner | `src/components/scanner/ConfirmPromo.tsx` |
| Validación en admin/pagos | sección "Compras de promociones" |
| Métricas de ventas | bloque superior de `/admin/promociones` |

## Migración

- Prisma: `prisma/migrations/20260739_add_promotion_purchase_engine/`
- Supabase (editor SQL, idempotente):
  `scripts/supabase-20260739-promotion-purchase-engine.sql`
  → incluye el bucket `promociones` + políticas; verificación de 12 filas OK.

## Checklist de validación E5

- [ ] Ejecutar el SQL 20260739 en Supabase (12 OK).
- [ ] Editor de promociones: subir imagen desde archivo (cambiar/quitar) y
      activar "Venta directa" con precio, usos, vigencia del beneficio,
      días/horario.
- [ ] Como cliente: «Adquirir» → instrucciones + cuentas → subir comprobante
      con fecha de transferencia → estado "En validación".
- [ ] Como admin: /admin/pagos muestra la compra con monto esperado y
      comprobante → Aprobar → el cliente recibe notificación y su QR aparece
      en Mis promociones.
- [ ] Escanear ese QR → pantalla de canje (valida estado/vigencia/usos/días/
      horario/empresa) → Confirmar → ticket con TX-ID (PROMOTION_USE) y, si
      quedan usos, QR regenerado.
- [ ] Consumir el último uso → compra CONSUMIDA; re-escanear el QR usado →
      registro de la operación (historial E4).
- [ ] Rechazar un pago con motivo → cliente notificado y puede reintentar.
- [ ] Promoción gratis (precio 0) → activación directa con QR inmediato.
- [ ] Promoción con maxCanjes en el límite → "agotada" al solicitar y el cupo
      atómico bloquea la sobreventa al aprobar.
- [ ] /admin/promociones muestra ingresos, vendidas, pagos por validar y
      conversión.
- [ ] Mis promociones muestra activas/pendientes/historial y la línea de
      tiempo de estados de cada compra.
