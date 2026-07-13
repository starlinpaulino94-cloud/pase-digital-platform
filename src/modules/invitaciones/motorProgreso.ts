import { prisma } from '@/lib/prisma'
import { otorgarBeneficioCampana } from '@/modules/invitaciones/beneficios'
import { crearNotificacion } from '@/modules/notificaciones/service'

/**
 * Incrementa el progreso de un invitante dentro de una campaña cuando uno de
 * sus referidos completa el registro. Crea el registro de progreso si no
 * existe, incrementa `registrosCompletados`, y marca `metaAlcanzada` cuando
 * se cumple la meta de la campaña. Además entrega el beneficio de bienvenida
 * al invitado y notifica al invitante cuando alcanza su meta.
 *
 * No lanza: un fallo del motor nunca rompe el registro del referido.
 */
export async function incrementarProgresoCampana(
  campanaId: string,
  referenteClienteId: string,
  companyId: string,
  referidoClienteId?: string
): Promise<void> {
  try {
    const campana = await prisma.campanaInvitacion.findUnique({
      where: { id: campanaId },
      select: { id: true, nombre: true, metaRegistros: true, estado: true },
    })
    if (!campana || campana.estado !== 'ACTIVA') return

    const progreso = await prisma.invitacionProgreso.upsert({
      where: { campanaId_clienteId: { campanaId, clienteId: referenteClienteId } },
      update: { registrosCompletados: { increment: 1 } },
      create: {
        campanaId,
        clienteId: referenteClienteId,
        companyId,
        registrosCompletados: 1,
      },
    })

    const alcanzaMeta =
      !progreso.metaAlcanzada && progreso.registrosCompletados >= campana.metaRegistros
    if (alcanzaMeta) {
      await prisma.invitacionProgreso.update({
        where: { id: progreso.id },
        data: { metaAlcanzada: true },
      })
      await notificarMetaAlcanzada(referenteClienteId, campana.nombre)
    }

    await prisma.invitacionEvento.create({
      data: {
        campanaId,
        clienteId: referenteClienteId,
        companyId,
        tipo: 'REGISTRO_COMPLETADO',
        ...(referidoClienteId ? { meta: { referidoClienteId } } : {}),
      },
    })

    // Regalo de bienvenida prometido en la landing: se entrega al INVITADO
    // en cuanto su registro queda atribuido a la campaña.
    if (referidoClienteId) {
      await otorgarBeneficioCampana({
        campanaId,
        clienteId: referidoClienteId,
        rol: 'INVITADO',
      })
    }
  } catch (e) {
    console.error('[invitaciones] incrementarProgresoCampana error:', e)
  }
}

async function notificarMetaAlcanzada(clienteId: string, campanaNombre: string) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { supabaseId: true },
    })
    if (!cliente) return
    const user = await prisma.user.findUnique({
      where: { supabaseId: cliente.supabaseId },
      select: { id: true },
    })
    if (!user) return
    await crearNotificacion({
      userId: user.id,
      tipo: 'RECOMPENSA_REFERIDO',
      titulo: '¡Meta alcanzada! 🎉',
      mensaje: `Completaste la meta de "${campanaNombre}". Entra y reclama tu premio.`,
      href: '/cliente/invita-y-gana',
    })
  } catch (e) {
    console.error('[invitaciones] notificarMetaAlcanzada error:', e)
  }
}
