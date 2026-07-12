import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { ConfettiCelebration } from '@/components/growth/ConfettiCelebration'

export const dynamic = 'force-dynamic'

/**
 * Growth Engine 3.0 · Pantalla de celebración tras registrarse por invitación
 * (req #4). Muestra confeti y el beneficio recién desbloqueado.
 */
export default async function CelebracionPage() {
  const user = await requireRole('CLIENTE')
  const clienteId = user.metadata.clienteId

  // Beneficio recién otorgado: la compra ACTIVA más reciente del cliente.
  let beneficio: string | null = null
  if (clienteId) {
    const compra = await prisma.productoCompra
      .findFirst({
        where: { clienteId, estado: 'ACTIVA' },
        orderBy: { createdAt: 'desc' },
        select: { promocion: { select: { titulo: true } } },
      })
      .catch(() => null)
    beneficio = compra?.promocion?.titulo ?? null
  }

  return (
    <ConfettiCelebration
      beneficio={beneficio}
      href={beneficio ? '/cliente/mis-promociones' : '/cliente/membresia'}
      ctaLabel={beneficio ? 'Ver mi beneficio' : 'Ir a mi cuenta'}
    />
  )
}
