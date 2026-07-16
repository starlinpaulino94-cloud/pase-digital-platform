# MembeGo · Share Engine

Sistema de compartición con vista previa enriquecida (estilo Temu/AliExpress/
Airbnb): cualquier enlace de MembeGo compartido por WhatsApp, Facebook,
Telegram o X se muestra como una **tarjeta visual completa** (imagen oficial,
título atractivo, descripción persuasiva y marca MembeGo), nunca como texto
plano.

## Piezas

| Pieza | Archivo | Qué hace |
|---|---|---|
| Tarjeta OG genérica | `src/lib/share/og.tsx` | `shareCardResponse()` genera la imagen 1200×630: la imagen oficial de la entidad como fondo (con velo de legibilidad) o degradado de marca; badge de categoría, chip de empresa, título y dato protagonista (descuento/precio/regalo). |
| Metadatos unificados | `src/lib/share/metadata.ts` | `shareMetadata()` construye og:title/description/image/url/type + twitter:card/title/description/image para cualquier ruta compartible. |
| Botones de compartir | `ShareButton`, `ShareMenu`, `SharePromocionMenu`, `InvitaShareButton` | Compartir nativo (navigator.share) con URL **pública** (nunca `/cliente/...`, que llevaría al robot de vista previa al login). |

## Rutas públicas cubiertas

| Entidad | URL pública | Imagen de la tarjeta |
|---|---|---|
| Promoción | `/promocion/{id}` | Imagen oficial de la promo + badge de descuento |
| Membresía promocionada | `/plan/{id}` | Tarjeta con plan, precio y empresa |
| Empresa | `/empresas/{slug}` | Banner oficial de la empresa |
| Campaña Invita y Gana | `/invita/{slug}` | Imagen OG de la campaña (o banner/colores) |
| Enlace personal de invitación | `/invitar/{code}` | Misma tarjeta de la campaña |
| Invitación Growth | `/i/{code}` | Beneficio + quien invita |

Cada ruta tiene su `opengraph-image.tsx`; Next lo inyecta solo como
`og:image`/`twitter:image`. No hace falta declarar la imagen en la metadata.

**Regla de la tarjeta GRANDE**: WhatsApp solo muestra la tarjeta grande si la
imagen pesa menos de ~600 KB. Por eso, cuando la entidad tiene foto oficial
ligera se sirve la foto ORIGINAL (JPEG, como hace Temu); la tarjeta compuesta
(PNG) queda para entidades sin foto o con foto demasiado pesada.

**Regla de los ~5 segundos**: el robot de WhatsApp corta la vista previa si la
página o la imagen tardan. Por eso en campañas:
- la `og:image` apunta DIRECTO al CDN (Supabase) cuando hay imagen oficial —
  sin pasar por ninguna función; la tarjeta compuesta vive en `/og/campana`
  (fuera de `/api`, que robots.txt bloquea y Meta lo respeta);
- las queries de campaña usan `React.cache` (metadata y página comparten una
  sola resolución por request);
- los robots (`esBotDeVistaPrevia`, src/lib/share/bots.ts) NO disparan
  registros de eventos ni lookups de personalización — menos latencia y
  embudo sin visitas fantasma.

Consejo operativo: sube imágenes de campaña de menos de 600 KB (ideal
1200×630) para garantizar la tarjeta grande.

## Configuración por campaña (panel admin)

En el editor de campañas (sección **“Compartir · vista previa del enlace”**):

- **Título Open Graph** — vacío = título de la campaña.
- **Descripción Open Graph** — vacío = descripción de la campaña.
- **CTA de la landing** — botón que revela el registro (por defecto “Quiero mi regalo”).
- **Imagen para compartir** — la “Imagen (compartir / OG)” de la sección Apariencia.
- **Imagen de la landing** — el “Banner del landing”.

Se guarda en el JSON `contenido` de la campaña (sin migración de BD).

## Flujo del enlace compartido

1. El invitado abre el enlace → **landing promocional** (no el formulario):
   imagen principal, beneficio destacado, contador regresivo hasta el fin de
   la campaña, explicación y CTA.
2. CTA → registro en la misma página.
3. Felicitación con confeti + QR del premio en su wallet.
4. Invitación a compartir con más personas.

Las campañas nuevas nacen con la landing de presentación activada
(`usarBanner`), y el admin puede desactivarla por campaña.

## Cómo añadir una nueva entidad compartible

1. Crear la ruta pública (`/loquesea/[id]/page.tsx`) con `generateMetadata`
   usando `shareMetadata()`.
2. Añadir `opengraph-image.tsx` en esa ruta llamando a `shareCardResponse()`
   con los datos de la entidad.
3. El botón de compartir debe pasar la URL pública (`landingUrlFor(...)`).
