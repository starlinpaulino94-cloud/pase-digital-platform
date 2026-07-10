import { notFound } from 'next/navigation'
import { recordPromotionView } from '@/modules/marketplace/actions'
import { getPromotionDetail } from '@/modules/marketplace/queries'
import { PromotionDetail } from '@/components/marketplace/PromotionDetail'

interface PromotionDetailPageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 3600

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
