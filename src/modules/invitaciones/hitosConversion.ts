import { prisma } from '@/lib/prisma'

/**
 * Hitos de conversión del embudo Growth Engine: cuando un cliente que llegó
 * por una campaña de invitación adquiere su primera membresía o hace su
 * primer canje, se registra el evento en el embudo de la campaña. Cuando
 * completa AMBOS hitos, se marca la CONVERSION_FINAL.
 *
 * Los eventos se registran con clienteId = el INVITANTE (consistente con el
 * resto del embudo) y meta.referidoClienteId = el cliente convertido, que
 * además sirve de llave de deduplicación (cada hito cuenta una sola vez por
 * cliente referido).
 *
 * IMPORTANTE: este módulo NO lleva 'use server' — funciones internas de
 * servidor. Nunca lanzan: un fallo del tracking jamás rompe la activación
 * de una membresía ni el registro de una visita/canje.
 */
export async function registrarHitoInvitacion(
  clienteId: string,
  tipo: 'MEMBRESIA_ADQUIRIDA' | 'PRIMER_CANJE'
): Promise<void> {
  try {
    const referido = await prisma.referido.findUnique({
      where: { referidoClienteId: clienteId },
      select: {
        campanaInvitacionId: true,
        referenteClienteId: true,
        companyId: true,
        sospechoso: true,
      },
    })
    if (!referido?.campanaInvitacionId || referido.sospechoso) return
    const campanaId = referido.campanaInvitacionId

    const yaRegistrado = await prisma.invitacionEvento.findFirst({
      where: {
        campanaId,
        tipo,
        meta: { path: ['referidoClienteId'], equals: clienteId },
      },
      select: { id: true },
    })
    if (yaRegistrado) return

    await prisma.invitacionEvento.create({
      data: {
        campanaId,
        clienteId: referido.referenteClienteId,
        companyId: referido.companyId,
        tipo,
        meta: { referidoClienteId: clienteId },
      },
    })

    // CONVERSION_FINAL: membresía + primer canje = cliente convertido.
    const otroHito = tipo === 'MEMBRESIA_ADQUIRIDA' ? 'PRIMER_CANJE' : 'MEMBRESIA_ADQUIRIDA'
    const [tieneOtro, yaConvertido] = await Promise.all([
      prisma.invitacionEvento.findFirst({
        where: {
          campanaId,
          tipo: otroHito,
          meta: { path: ['referidoClienteId'], equals: clienteId },
        },
        select: { id: true },
      }),
      prisma.invitacionEvento.findFirst({
        where: {
          campanaId,
          tipo: 'CONVERSION_FINAL',
          meta: { path: ['referidoClienteId'], equals: clienteId },
        },
        select: { id: true },
      }),
    ])
    if (tieneOtro && !yaConvertido) {
      await prisma.invitacionEvento.create({
        data: {
          campanaId,
          clienteId: referido.referenteClienteId,
          companyId: referido.companyId,
          tipo: 'CONVERSION_FINAL',
          meta: { referidoClienteId: clienteId },
        },
      })
    }
  } catch (e) {
    console.error('[invitaciones] registrarHitoInvitacion error:', e)
  }
}
