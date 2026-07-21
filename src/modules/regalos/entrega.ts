import { prisma } from '@/lib/prisma'
import { crearNotificacion } from '@/modules/notificaciones/service'

/**
 * Regalos P2P · Fase R3 — entrega de regalos PAGADOS (compra o membresía).
 *
 * El regalo pagado vive vinculado a su orden (compra bajo el COMPRADOR con
 * `beneficiarioClienteId`, o membresía creada a nombre del amigo). Cuando el
 * pago se valida —caja, panel o transferencia—, la ACTIVACIÓN llama aquí:
 *  - `entregarCompraABeneficiario`: reasigna la compra a la wallet del amigo
 *    ANTES de activar (QR y notificaciones le llegan a él).
 *  - `resolverRegaloPagado`: marca el Regalo como ACEPTADO y avisa a ambos.
 * Nada aquí lanza: la activación jamás debe romperse por el regalo.
 */

/** Notifica al User dueño de un Cliente (si tiene cuenta vinculada). */
export async function notificarClienteRegalo(
  clienteId: string,
  titulo: string,
  mensaje: string,
  href: string
) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { supabaseId: true },
    })
    if (!cliente?.supabaseId) return
    const u = await prisma.user.findUnique({
      where: { supabaseId: cliente.supabaseId },
      select: { id: true },
    })
    if (u) await crearNotificacion({ userId: u.id, tipo: 'SISTEMA', titulo, mensaje, href })
  } catch (e) {
    console.error('[regalos] notificar', e)
  }
}

/**
 * Si la compra es un regalo (beneficiario ≠ comprador), la reasigna al
 * beneficiario. Llamar ANTES de activar. Devuelve true si hubo reasignación.
 */
export async function entregarCompraABeneficiario(compra: {
  id: string
  clienteId: string
  companyId: string
  beneficiarioClienteId: string | null
}): Promise<boolean> {
  try {
    if (!compra.beneficiarioClienteId || compra.beneficiarioClienteId === compra.clienteId) {
      return false
    }
    const beneficiario = await prisma.cliente.findFirst({
      where: { id: compra.beneficiarioClienteId, companyId: compra.companyId },
      select: { id: true },
    })
    // Beneficiario borrado: la compra queda con el comprador (mejor que perderla).
    if (!beneficiario) return false
    await prisma.productoCompra.update({
      where: { id: compra.id },
      data: { clienteId: beneficiario.id },
    })
    return true
  } catch (e) {
    console.error('[regalos] entregarCompraABeneficiario', e)
    return false
  }
}

/**
 * Resuelve el Regalo pagado vinculado a una compra o membresía recién
 * activada: PENDIENTE → ACEPTADO + notificación a ambas partes.
 */
export async function resolverRegaloPagado(vinculo: {
  compraId?: string
  membershipId?: string
}) {
  try {
    const regalo = await prisma.regalo.findFirst({
      where: {
        estado: 'PENDIENTE',
        ...(vinculo.compraId
          ? { tipo: 'REGALO_COMPRA', compraDestinoId: vinculo.compraId }
          : { tipo: 'REGALO_MEMBRESIA', membershipDestinoId: vinculo.membershipId }),
      },
      include: {
        remitente: { select: { id: true, nombre: true } },
        destinatario: { select: { id: true, nombre: true } },
      },
    })
    if (!regalo || !regalo.destinatarioId) return

    const upd = await prisma.regalo.updateMany({
      where: { id: regalo.id, estado: 'PENDIENTE' },
      data: { estado: 'ACEPTADO', resueltoAt: new Date() },
    })
    if (upd.count === 0) return

    let etiqueta = 'tu regalo'
    if (regalo.promocionId) {
      const p = await prisma.promocion.findUnique({
        where: { id: regalo.promocionId },
        select: { titulo: true },
      })
      etiqueta = p?.titulo ?? etiqueta
    } else if (regalo.planId) {
      const p = await prisma.plan.findUnique({
        where: { id: regalo.planId },
        select: { nombre: true },
      })
      etiqueta = p ? `tu membresía ${p.nombre}` : 'tu membresía'
    }

    const remitenteNombre = regalo.remitente.nombre.split(/\s+/)[0]
    await notificarClienteRegalo(
      regalo.destinatarioId,
      `🎁 ${remitenteNombre} te hizo un regalo`,
      `Ya tienes ${etiqueta} en tu cuenta${regalo.mensaje ? `: “${regalo.mensaje}”` : '.'}`,
      regalo.compraDestinoId
        ? `/cliente/mis-promociones/${regalo.compraDestinoId}`
        : '/mis-membresias'
    )
    await notificarClienteRegalo(
      regalo.remitenteId,
      '🎉 Tu regalo fue entregado',
      `${regalo.destinatario?.nombre.split(/\s+/)[0] ?? 'Tu amigo'} ya recibió ${etiqueta}.`,
      '/cliente/regalos'
    )
  } catch (e) {
    console.error('[regalos] resolverRegaloPagado', e)
  }
}
