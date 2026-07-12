# Growth Engine 3.0 — Sistema viral de referidos

Cada enlace compartido deja de ser un simple link y pasa a ser una **campaña de
adquisición**: una landing que vende el beneficio primero, con contador de
urgencia, y un motor de recompensas **configurable por evento** que entrega
premios como **Beneficios Digitales (E8)**, puntos o créditos. Se construye
sobre el motor de eventos EN VIVO (E6) **sin romper nada**: los enlaces legacy
del cliente siguen funcionando.

## Arquitectura (módulo independiente)

`src/modules/growth/` — separado de promociones y membresías, integrado por
**eventos**. Nada de recompensas fijas en código.

| Pieza | Ruta |
|---|---|
| Config por empresa (defaults + presets de duración) | `src/modules/growth/config.ts` |
| Enlaces de invitación (crear/resolver/landing) | `src/modules/growth/links.ts` |
| Motor de recompensas configurable + entrega | `src/modules/growth/rewards.ts` |
| Enganche de registro y conversión | `src/modules/growth/registro.ts` |
| Server Actions (cliente + admin) | `src/modules/growth/actions.ts` |
| Consultas de panel | `src/modules/growth/queries.ts` |
| Landing del referido | `src/app/(public)/i/[code]/` |
| Celebración con confeti | `src/app/(cliente)/cliente/celebracion/` |
| Panel admin del programa | `src/app/(admin)/admin/crecimiento/` |

### Modelos (Prisma)

- **GrowthLink** — cada invitación: código, referente, empresa, beneficio
  ofrecido (Promoción E8), campaña, `duracionHoras` y `expiresAt`.
- **GrowthConfig** — qué premia la empresa + duración por defecto + landing on/off.
- **GrowthRule** — regla por evento: `trigger` → recompensa, beneficiario,
  condición (plan / umbral).
- **GrowthReward** — ledger idempotente (`dedupeKey`); entrega vía ProductoCompra.
- **GrowthWallet** — saldo de puntos/créditos por empresa y cliente.
- **ReferralEvent** — +`growthLinkId`, +eventos `LANDING_VIEW` y `PRIMER_USO`.

## Flujo (req 1–5)

1. `/r/[code]` resuelve el GrowthLink → redirige a la **landing** `/i/[code]`
   (no al registro). Registra `CLICK` atribuido al enlace.
2. Landing (`/i/[code]`): imagen del beneficio, logos, título, beneficio que
   recibe, **contador regresivo** (tiempo del servidor), prueba social y CTA
   «Quiero aprovechar esta promoción». Registra `LANDING_VIEW`.
3. Expiración **verificada en servidor** (`resolverGrowthLink`); si venció,
   muestra «Esta invitación expiró» + otras promociones.
4. Al pulsar el CTA → registro con `?ref` (atribución legacy) y `?gl` (enlace).
5. Tras registrarse: **beneficio de bienvenida inmediato** (el que ofrecía el
   enlace) + reglas configurables del evento REGISTRO → **celebración con
   confeti** y «Ver mi beneficio».

## Embudo y eventos reales (req 7–8)

Todo se mide con eventos reales (`ReferralEvent`) atribuidos al enlace:
`CLICK → LANDING_VIEW → REGISTRO → VERIFICADO → MEMBRESIA/COMPRA → PRIMER_USO →
RECOMPENSA`. Cada evento tiene fecha/hora. El embudo por referente:
`getGrowthFunnel`.

## Recompensas configurables (req 9, 11, 12)

`GrowthRule` (panel `/admin/crecimiento`): el admin define **cuándo** (evento),
**qué** (puntos / créditos / **Beneficio Digital E8** / lavados / descuento),
**a quién** (referente / referido / ambos) y la **condición** (plan específico
o umbral de referidos). La entrega es idempotente (`dedupeKey`) y, para
Beneficios, crea un **ProductoCompra activo con QR** (mismo motor que E8).

Cada empresa administra su propio programa; no hay configuración global
obligatoria.

## Compartir enriquecido (req 6)

La landing tiene `generateMetadata` (Open Graph + Twitter Card) y
`opengraph-image` dinámica: al pegar el enlace en WhatsApp/redes se ve una
tarjeta con «{referente} te invita», el beneficio y la imagen.

## Antifraude (req 16)

- **Auto-referido / auto-clic**: `/r/[code]` no cuenta al dueño del enlace;
  `procesarRegistroGrowth` ignora si el invitado es el referente.
- **Bots de preview**: filtro por user-agent (no inflan clics).
- **Rate limit**: 5 clics/hora por IP y enlace.
- **Huella repetida**: reutiliza `esRegistroSospechoso` (IP/visitor repetidos);
  un `Referido` sospechoso **no** dispara recompensas.
- **Doble entrega**: `dedupeKey` único en `GrowthReward`.

## Migración

- Prisma: `prisma/migrations/20260744_growth_engine/`
- Supabase (idempotente): `scripts/supabase-20260744-growth-engine.sql` (6 filas OK).

## Compatibilidad

El sistema NO rompe nada: los enlaces del código del cliente (legacy) siguen
redirigiendo al registro; el motor E6 (eventos, embudo, niveles de embajador)
sigue intacto y el Growth Engine se apoya en él.

**Paso del operador:** ejecutar `scripts/supabase-20260744-growth-engine.sql`
en Supabase (6 filas OK).
