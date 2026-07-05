'use server'

/**
 * Punto de activación único para membresías.
 * Tanto la aprobación manual del admin como futuras pasarelas de pago
 * deben invocar esta función para garantizar un flujo consistente.
 */

import { prisma } from '@/lib/prisma'
import { periodEnd } from '@/lib/server-utils'

type Meta = { ipAddress: string | null; userAgent: string | null }

type ActivarResult =
  | { ok: true; clienteId: string; companyId: string; supabaseId: string; planNombre: string; esPrimera: boolean }
  | { ok: false; error: string }

// Estados desde los que se permite activar una membresía.
const ESTADOS_ACTIVABLES = new Set(['PENDIENTE', 'PENDIENTE_PAGO', 'RECHAZADA', 'VENCIDA'])

export async function activarMembresia(
  membershipId: string,
  userId: string | null,
  meta: Meta
): Promise<ActivarResult> {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { plan: true, cliente: true },
  })
  if (!membership) return { ok: false, error: 'Membresía no encontrada.' }
  if (membership.estado === 'ACTIVA') return { ok: false, error: 'La membresía ya está activa.' }
  if (!ESTADOS_ACTIVABLES.has(membership.estado)) {
    return { ok: false, error: `No se puede activar una membresía en estado ${membership.estado}.` }
  }

  const now = new Date()
  const vigenciaDias = membership.plan.vigenciaDias ?? 30

  // esPrimera se calcula dentro de la transacción para evitar race condition
  // con activaciones concurrentes del mismo cliente EN ESTA EMPRESA.
  const { esPrimera } = await prisma.$transaction(async (tx) => {
    const previasConfirmadas = await tx.membership.count({
      where: {
        clienteId: membership.clienteId,
        companyId: membership.companyId,
        pagoConfirmado: true,
      },
    })
    const esPrimera = previasConfirmadas === 0

    await tx.membership.update({
      where: { id: membership.id },
      data: {
        estado: 'ACTIVA',
        fechaInicio: now,
        fechaVencimiento: periodEnd(now, vigenciaDias),
        lavadosRestantes: membership.plan.esIlimitado ? 0 : membership.plan.lavadosIncluidos,
        montoPagado: Number(membership.plan.precio),
        pagoConfirmado: true,
        rechazadoReason: null,
        adminNota: null,
      },
    })

    // Create QR for this specific membership
    const newQr = await tx.qrToken.create({
      data: {
        clienteId: membership.clienteId,
        membresiaId: membership.id,
      },
    })

    await tx.auditLog.create({
      data: {
        companyId: membership.companyId,
        userId,
        accion: 'QR_GENERADO',
        entidadTipo: 'QrToken',
        entidadId: newQr.id,
        payload: {
          clienteId: membership.clienteId,
          membresiaId: membership.id,
          motivo: 'activacion_membresia',
        },
        ...meta,
      },
    })

    await tx.auditLog.create({
      data: {
        companyId: membership.companyId,
        userId,
        accion: 'PAGO_APROBADO',
        entidadTipo: 'Membership',
        entidadId: membership.id,
        payload: { planId: membership.planId, clienteId: membership.clienteId, monto: Number(membership.plan.precio) },
        ...meta,
      },
    })

    return { esPrimera }
  })

  return {
    ok: true,
    clienteId: membership.clienteId,
    companyId: membership.cliente.companyId,
    supabaseId: membership.cliente.supabaseId,
    planNombre: membership.plan.nombre,
    esPrimera,
  }
}
