import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { recordPromotionView } from '@/modules/marketplace/actions'
import { getPromotionDetail, getPromotionOg } from '@/modules/marketplace/cached'
import { PromotionDetail } from '@/components/marketplace/PromotionDetail'
import { SITE_NAME } from '@/lib/site'
import { shareMetadata } from '@/lib/share/metadata'

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

  // Share Engine: los textos EDITADOS por el negocio tienen prioridad.
  const title = og.ogTitulo || `${og.titulo} · ${og.empresa}`
  const descuento =
    og.descuento && og.descuento > 0 ? `${og.descuento}% de descuento · ` : ''
  const description = (
    og.ogDescripcion ||
    `${descuento}${og.descripcion || `Beneficio de ${og.empresa} en ${SITE_NAME}`}`
  ).slice(0, 200)
  // Share Engine: la imagen la genera opengraph-image.tsx de esta ruta
  // (tarjeta con la imagen oficial de la promo y el descuento protagonista).
  return shareMetadata({
    title,
    description,
    url: `/promocion/${og.id}`,
  })
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
