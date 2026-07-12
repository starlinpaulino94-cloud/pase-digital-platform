# Fase E8 — Beneficios Digitales (evolución de Promociones)

Las promociones dejan de ser un aviso estático y pasan a ser **beneficios
digitales**: productos compartibles con vista previa enriquecida, adquiribles
(gratis o de pago), con QR propio y estados claros. Esta fase eleva lo que ya
construyó E5 (compra → QR → canje) y añade la capa de **distribución** (compartir
como en Temu / Mercado Libre / Booking) y una **arquitectura preparada para
crecer** (cupones, gift cards, bonos, eventos, membresías).

## 1) Vista previa al compartir (Open Graph + Twitter Cards)

Al compartir el enlace público de una promoción, WhatsApp / Facebook / Telegram
/ X / LinkedIn / Discord / Email muestran una tarjeta con **imagen, nombre,
empresa, descripción corta, descuento y marca MembeGo**.

| Pieza | Ruta |
|---|---|
| Metadata dinámica (OG + Twitter Card) | `src/app/(public)/promocion/[id]/page.tsx` → `generateMetadata` |
| Imagen dinámica 1200×630 por promoción | `src/app/(public)/promocion/[id]/opengraph-image.tsx` (`next/og`) |
| Datos seguros de la vista previa | `getPromotionOg()` en `src/modules/marketplace/queries.ts` |

- `getPromotionOg` sólo expone promociones **públicas** (activa, publicada, no
  privada, no vencida) y campos mínimos; nunca datos internos.
- La imagen se genera bajo demanda y se cachea (`revalidate = 3600`). Si la
  promoción no es pública, cae a una tarjeta de marca genérica (sin filtrar
  datos).

## 2) Compartir como acción primaria

`SharePromocionMenu` (`src/components/public/SharePromocionMenu.tsx`) se ubica
**arriba del detalle**, prominente:

- **Móvil**: hoja nativa del sistema (`navigator.share`).
- **Escritorio**: menú con **Copiar enlace, WhatsApp, Facebook, Telegram,
  Email, X, LinkedIn**.
- Cada compartir registra el contador (`recordPromotionShare`).

## 3) Adquirir siempre (gratis o de pago), con confirmación

- El CTA es **siempre "Adquirir promoción"** — nunca "Ver promoción" /
  "Solicitar". (`ComprarPromoButton`, `PromotionDetail`, `PromotionCard`).
- Al presionarlo se muestra una **confirmación** con el resumen:
  - **Gratis** → *Activar ahora* → activada → **QR inmediato**.
  - **De pago** → *Continuar al pago* → solicitud → pantalla de transferencia →
    **QR al validar** el comprobante.

## 6/7) QR propio y canje

Cada adquisición tiene su **QR único** ligado a la compra (`ProductoCompra` +
`QrToken`), no reutiliza el QR de membresía. El canje por el escáner valida
estado, vigencia, usos, días y horario (`validarConsumoCompra`) y registra la
transición en la bitácora inmutable (`ProductoCompraTransicion`).

## 10/11/12) Promociones adquiridas: tarjetas, estados e historial

- `src/app/(cliente)/cliente/mis-promociones/` — lista por secciones (Activas /
  Pendientes / Historial) con imagen, empresa, fecha, usos y **estado con color
  e ícono**.
- Detalle (`.../[id]`): QR, resumen (precio, usos, activación, vencimiento),
  **Compartir**, pago/validación e **historial de la compra** (timeline de
  transiciones).

### Estados con color e iconografía

`src/components/cliente/compra-estado.ts` — `compraEstadoVisual(estado, ctx)`
devuelve `label`, `badge` (color), `icon` y `hint`. Estados:

| Estado | Origen | Color |
|---|---|---|
| Disponible | `SOLICITADA` | neutro |
| Pendiente de pago | `PENDIENTE_PAGO` | warning |
| En validación / Aprobada | `EN_VALIDACION` / `APROBADA` | info |
| Activa | `ACTIVA` | success |
| **Parcialmente utilizada** | `ACTIVA` con usos consumidos (derivado) | info |
| Completada | `CONSUMIDA` | neutro |
| Expirada | `EXPIRADA` | warning |
| Cancelada / Pago rechazado | `CANCELADA` / `RECHAZADA` | neutro / destructive |
| **Suspendida** | empresa suspendida (derivado de presentación) | warning |

Los dos **derivados** (Parcialmente utilizada, Suspendida) son lecturas del
mismo dato: no añaden valores al enum ni tocan el motor de estados.

## 8) Membresías promocionables

Los planes de membresía también son **beneficios compartibles**:

- **Landing público por plan** — `src/app/(public)/plan/[id]/page.tsx`: detalle
  premium (empresa, precio, qué incluye, beneficios, descripción, condiciones)
  con **Adquirir plan** y **Compartir** como acciones prioritarias.
- **Vista previa al compartir** — `opengraph-image.tsx` del plan (tarjeta de
  marca con nombre, empresa, precio y "qué incluye") + `generateMetadata`
  (OG + Twitter Card). Datos vía `getPlanOg` / `getPlanPublic` (solo planes de
  empresas publicadas/activas).
- **Visibilidad** — desde el perfil público de la empresa cada plan enlaza a
  su página compartible ("Ver y compartir plan").
- **Adquisición** — reutiliza el flujo de membresía existente (registro →
  membresía → QR de acceso), sin duplicar motores. `Adquirir plan` lleva al
  registro de la empresa.

> Decisión de arquitectura: se reutiliza el ciclo de membresía actual (con su
> QR) en lugar de duplicarlo sobre `ProductoCompra`. El enum
> `ProductoComercialTipo.MEMBRESIA` queda reservado para una unificación futura
> del ciclo si el negocio lo requiere.

## 9) Tipo unificado de Beneficio Digital

`enum BeneficioTipo { PROMOTION, MEMBERSHIP, COUPON, VOUCHER, GIFT, EVENT }` y
`Promocion.beneficioTipo` (default `PROMOTION`). Hoy todo es `PROMOTION`; el
enum deja el terreno listo para que membresías, cupones, bonos, gift cards y
entradas compartan el **mismo ciclo** (adquirir → QR → canjear) sin rediseñar
la tabla ni el flujo.

- Prisma: `prisma/migrations/20260743_benefit_type/`
- Supabase (idempotente): `scripts/supabase-20260743-benefit-type.sql` (2 filas OK).

## 15) Arquitectura preparada para crecer (diseño, no implementación)

El módulo queda listo para extenderse **sin rediseño**:

- **Tipos de beneficio**: añadir `COUPON`/`GIFT`/`EVENT` es un valor del enum +
  presentación; el ciclo de compra y el QR ya son genéricos.
- **Estados**: nuevos estados de presentación se resuelven en
  `compraEstadoVisual` (como Parcialmente utilizada / Suspendida).
- **Pagos**: el puerto de pago de E5 (`metodoPago`, `precioCongelado`) admite
  pasarelas futuras sin tocar el flujo del cliente.
- **Compartir**: el sistema OG es por beneficio; cualquier tipo nuevo hereda la
  vista previa con sólo exponerlo en `getPromotionOg`.
- Pendiente de negocio (no implementado aquí): geolocalización, reservas,
  beneficios de embajador y beneficios a nivel de usuario.

## Validación

- [x] `npm run build` en verde (rutas `/promocion/[id]` y su `opengraph-image`).
- [x] `generateMetadata` + `opengraph-image` por promoción (OG + Twitter Card).
- [x] Compartir prominente arriba del detalle (nativo + menú de redes).
- [x] CTA único "Adquirir promoción" (gratis/pago) con confirmación.
- [x] Estados con color e ícono, incl. Parcialmente utilizada y Suspendida.
- [x] Enum `BeneficioTipo` + `Promocion.beneficioTipo` + migración + SQL.

**Paso del operador:** ejecutar `scripts/supabase-20260743-benefit-type.sql`
en Supabase (2 filas OK).
