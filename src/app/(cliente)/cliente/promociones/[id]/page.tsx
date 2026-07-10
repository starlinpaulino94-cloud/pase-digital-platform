import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { recordPromotionView } from '@/modules/marketplace/actions'
import { getPromotionDetail } from '@/modules/marketplace/queries'
import { PromotionDetail } from '@/components/marketplace/PromotionDetail'

export const dynamic = 'force-dynamic'

interface ClientePromocionPageProps {
  params: Promise<{ id: string }>
}

/**
 * Detalle de promoción INTERNO. Reutiliza <PromotionDetail mode="app" /> para
 * que el cliente autenticado no salga a la Landing.
 */
export default async function ClientePromocionPage({
  params,
}: ClientePromocionPageProps) {
  await requireRole('CLIENTE')
  const { id } = await params

  const promotion = await getPromotionDetail(id)
  if (!promotion) notFound()

  // Registrar vista (no bloqueante)
  recordPromotionView(id).catch(console.error)

  return <PromotionDetail mode="app" promotion={promotion} />
}
