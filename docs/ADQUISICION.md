# Origen de clientes (atribución de marketing)

> ¿De dónde llegan los que se registran? Facebook, Instagram, TikTok, WhatsApp,
> la tarjeta que se reparte en la calle, invitación de otro cliente o directo.
> Módulo: **Panel → Análisis → Origen de clientes** (`/admin/adquisicion`).

## Cómo funciona

1. **Enlaces por canal.** Cada canal tiene su enlace `https://www.membego.com/?src=canal`
   (el módulo los genera con botón de copiar y QR descargable). La tarjeta
   impresa lleva el QR del enlace `?src=tarjeta`.
2. **Cookie de primer toque.** Cuando alguien abre un enlace con `?src=`
   (o `utm_source=`), el middleware (`src/proxy.ts`) siembra la cookie
   `mg_canal` por 30 días. El PRIMER canal gana: visitas posteriores con otro
   `src` no la sobreescriben.
3. **Selector obligatorio en el registro.** El formulario pregunta
   **"¿Cómo nos conociste?"** (Facebook, Instagram, TikTok, WhatsApp, tarjeta
   en la calle, un amigo, Google, visitó el negocio, otro) — así hay
   atribución aunque el visitante NO haya llegado por un enlace `?src=`
   (p. ej. tarjetas ya repartidas sin QR). Componente
   `ComoNosConociste` (`canalDeclarado` en el FormData).
4. **Captura en el registro.** Al crearse la ficha del cliente —registro por
   empresa, cuenta general, Google o auto-reparación— `capturarCanalRegistro`
   guarda `clientes.canalOrigen` con prioridad **cookie del enlace** (más
   precisa: distingue campañas) **> canal declarado** por el usuario. Nunca
   bloquea el registro (tolera incluso la migración pendiente).
4. **Módulo de análisis.** KPIs, ranking por canal con % y barras, filtro por
   período y últimos registros con su canal. Sin cookie: `invitacion` si el
   cliente llegó por un enlace de referido, `directo` en el resto.

## Canales

- Predefinidos: `facebook`, `instagram`, `tiktok`, `whatsapp`, `tarjeta`.
- Personalizados: cualquier slug — p. ej. `tarjeta-parque`, `feria-auto`,
  `radio` — para distinguir campañas del mismo medio. Se etiquetan solos
  ("Tarjeta en la calle · parque").

## Piezas

- `src/modules/adquisicion/shared.ts` — cookie, sanitizado y etiquetas (puro,
  lo usa el middleware edge).
- `src/modules/adquisicion/canal.ts` — lectura de cookie + guardado en la ficha.
- `src/modules/adquisicion/queries.ts` — agregación por canal (tolerante a la
  migración pendiente).
- `src/components/adquisicion/EnlacesPromocion.tsx` — enlaces + QR + canal
  personalizado.
- Hooks de captura: `registro/actions.ts` (ambos flujos), `googleOnboarding.ts`
  (ambas altas) y `reparar-contexto.ts`.

## Migración (Supabase SQL Editor, idempotente)

```sql
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "canalOrigen" TEXT;
CREATE INDEX IF NOT EXISTS "clientes_companyId_canalOrigen_idx"
  ON "clientes" ("companyId", "canalOrigen");
```

Sin la migración el módulo funciona (todo cae en directo/invitación) y el
registro de clientes NUNCA se bloquea; la atribución empieza a guardarse en
cuanto la columna exista.
