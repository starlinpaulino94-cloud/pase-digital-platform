import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { recordPromotionView } from '@/modules/marketplace/actions'
import { getPromotionDetail } from '@/modules/marketplace/cached'
import { estadoLimiteCliente } from '@/modules/promociones/compra'
import { PromotionDetail } from '@/components/marketplace/PromotionDetail'
import { ComprarPromoButton } from '@/components/cliente/ComprarPromoButton'

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
  const user = await requireRole('CLIENTE')
  const { id } = await params

  const promotion = await getPromotionDetail(id)
  if (!promotion) notFound()

  // Registrar vista (no bloqueante)
  recordPromotionView(id).catch(console.error)

  // Límite por cliente (ej. "primer lavado gratis" = un solo uso): si ya llegó
  // al tope, el botón muestra "ya adquirida" en vez de dejar reintentar.
  const clienteId = user.metadata.clienteId as string | undefined
  const limite =
    promotion.venta && clienteId
      ? await estadoLimiteCliente(clienteId, promotion.id, promotion.venta.limitePorCliente)
      : { limite: null, adquiridas: 0, alcanzado: false }

  return (
    <PromotionDetail
      mode="app"
      promotion={promotion}
      comprarSlot={
        promotion.venta ? (
          <ComprarPromoButton
            promocionId={promotion.id}
            precio={promotion.venta.precio}
            agotada={promotion.venta.agotada}
            yaAdquirida={limite.alcanzado}
            unSoloUso={promotion.venta.limitePorCliente === 1}
          />
        ) : undefined
      }
    />
  )
}
