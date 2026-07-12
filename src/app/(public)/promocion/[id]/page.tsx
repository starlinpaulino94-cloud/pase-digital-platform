import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { recordPromotionView } from '@/modules/marketplace/actions'
import { getPromotionDetail, getPromotionOg } from '@/modules/marketplace/queries'
import { PromotionDetail } from '@/components/marketplace/PromotionDetail'
import { SITE_NAME } from '@/lib/site'

interface PromotionDetailPageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 3600

// Fase E8 · Vista previa enriquecida al compartir (Open Graph + Twitter Cards).
// La imagen la genera dinámicamente opengraph-image.tsx (misma ruta), así que
// aquí solo declaramos textos y URL; Next inyecta la imagen automáticamente.
export async function generateMetadata({
  params,
}: PromotionDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const og = await getPromotionOg(id)

  if (!og) {
    return { title: `Promoción · ${SITE_NAME}` }
  }

  const title = `${og.titulo} · ${og.empresa}`
  const descuento =
    og.descuento && og.descuento > 0 ? `${og.descuento}% de descuento · ` : ''
  const description = `${descuento}${og.descripcion || `Beneficio de ${og.empresa} en ${SITE_NAME}`}`.slice(
    0,
    200
  )
  const url = `/promocion/${og.id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PromotionDetailPage({
  params,
}: PromotionDetailPageProps) {
  const { id } = await params

  const promotion = await getPromotionDetail(id)

  if (!promotion) {
    notFound()
  }

  // Record view (non-blocking)
  recordPromotionView(id).catch(console.error)

  return <PromotionDetail mode="public" promotion={promotion} />
}
