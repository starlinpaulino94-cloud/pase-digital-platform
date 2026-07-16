import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/site'

/**
 * Share Engine · metadatos de compartición unificados.
 *
 * Toda ruta pública compartible (promoción, plan, empresa, campaña,
 * invitación) construye sus metadatos con este helper para que el enlace se
 * muestre como tarjeta enriquecida en WhatsApp/Facebook/Telegram/X:
 * og:title/description/image/url/type + twitter:card/title/description/image.
 *
 * La imagen puede venir explícita (`image`) o, si se omite, la aporta el
 * `opengraph-image.tsx` de la ruta (Next inyecta og:image y twitter:image
 * apuntando a la tarjeta generada — ver src/lib/share/og.tsx).
 */
export interface ShareMetadataInput {
  title: string
  description: string
  /** Ruta canónica del enlace (relativa a metadataBase o absoluta). */
  url: string
  siteName?: string
  /** Imagen explícita 1200×630. Omitir si la ruta tiene opengraph-image.tsx. */
  image?: string | null
  imageAlt?: string
  type?: 'website' | 'article'
}

export function shareMetadata({
  title,
  description: rawDescription,
  url,
  siteName = SITE_NAME,
  image,
  imageAlt,
  type = 'website',
}: ShareMetadataInput): Metadata {
  const description = rawDescription.slice(0, 200)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      title,
      description,
      url,
      siteName,
      locale: 'es_ES',
      ...(image
        ? { images: [{ url: image, width: 1200, height: 630, alt: imageAlt ?? title }] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
