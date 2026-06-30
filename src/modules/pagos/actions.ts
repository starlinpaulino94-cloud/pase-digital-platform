'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createReceiptPago } from '@/lib/receipts'
import { notifyPagoAprobado, notifyPagoRechazado, notifyQrGenerado } from '@/lib/notifications'
import { logAudit } from '@/lib/audit'
import { ADMIN_ROLES } from '@/types'
import type { Prisma } from '@prisma/client'

export interface PagoState {
  error?: string
  success?: boolean
  paymentId?: string
}

/**
 * Registra un pago pendiente (cliente).
 * - TRANSFERENCIA: sube comprobante a Supabase Storage.
 * - PRESENCIAL: sin comprobante, el cliente paga en sucursal.
 */
export async function registrarPago(
  _prev: PagoState,
  formData: FormData
): Promise<PagoState> {
  try {
    const user = await getUser()
    if (!user || user.metadata.role !== 'CLIENTE') {
      return { error: 'No autorizado.' }
    }

    const planId = String(formData.get('planId') ?? '')
    const metodo = String(formData.get('metodo') ?? '')
    const referencia = String(formData.get('referencia') ?? '').trim() || null
    const comprobante = formData.get('comprobante') as File | null

    if (!planId) return { error: 'Plan no válido.' }
    if (!metodo || !['TRANSFERENCIA', 'PRESENCIAL'].includes(metodo)) {
      return { error: 'Método de pago no válido.' }
    }
    if (metodo === 'TRANSFERENCIA' && !comprobante && !referencia) {
      return { error: 'Sube el comprobante o ingresa la referencia de la transferencia.' }
    }

    // Validar plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId, activo: true },
      include: { company: true },
    })
    if (!plan) return { error: 'Plan no disponible.' }

    // Validar que el cliente exista y pertenezca a la misma empresa
    if (!user.metadata.clienteId) return { error: 'Perfil de cliente no encontrado.' }
    const cliente = await prisma.cliente.findUnique({
      where: { id: user.metadata.clienteId },
    })
    if (!cliente || cliente.companyId !== plan.companyId) {
      return { error: 'El plan no pertenece a tu empresa.' }
    }

    // Validar que no tenga membresía activa
    const active = await prisma.membership.findFirst({
      where: { clienteId: cliente.id, estado: 'ACTIVA' },
    })
    if (active) return { error: 'Ya tienes una membresía activa.' }

    // Subir comprobante si es transferencia
    let comprobanteUrl: string | null = null
    if (metodo === 'TRANSFERENCIA' && comprobante && comprobante.size > 0) {
      try {
        const supabaseAdmin = createAdminClient()
        const ext = comprobante.name.split('.').pop() || 'jpg'
        const fileName = `comprobantes/${cliente.id}/${Date.now()}.${ext}`
        const arrayBuffer = await comprobante.arrayBuffer()
        const { error: uploadError } = await supabaseAdmin.storage
          .from('comprobantes')
          .upload(fileName, arrayBuffer, {
            contentType: comprobante.type,
            upsert: false,
          })
        if (uploadError) throw uploadError
        const { data: urlData } = supabaseAdmin.storage
          .from('comprobantes')
          .getPublicUrl(fileName)
        comprobanteUrl = urlData.publicUrl
      } catch (e) {
        console.error('[pagos] upload failed:', e)
        return { error: 'No se pudo subir el comprobante. Intenta de nuevo.' }
      }
    }

    // Crear membresía PENDIENTE + Payment PENDIENTE
    const result = await prisma.$transaction(async (tx) => {
      // Crear membresía pendiente (sin lavados cargados aún)
      const membership = await tx.membership.create({
        data: {
          clienteId: cliente.id,
          planId: plan.id,
          userId: user.metadata.dbUserId,
          estado: 'PENDIENTE',
          lavadosRestantes: 0, // se cargan al aprobar el pago
        },
      })

      // Crear payment pendiente
      const payment = await tx.payment.create({
        data: {
          membershipId: membership.id,
          monto: plan.precio,
          metodo: metodo as 'TRANSFERENCIA' | 'PRESENCIAL',
          estado: 'PENDIENTE',
          comprobanteUrl,
          referencia,
        },
      })

      return { membership, payment }
    })

    // Auditoría
    await logAudit({
      userId: user.metadata.dbUserId,
      empresaId: plan.companyId,
      accion: 'registrar_pago',
      entidad: 'Payment',
      entidadId: result.payment.id,
      datosDespues: {
        metodo,
        monto: Number(plan.precio),
        membershipId: result.membership.id,
      } as Prisma.InputJsonObject,
    })

    revalidatePath('/cliente/planes')
    revalidatePath('/cliente/dashboard')

    return { success: true, paymentId: result.payment.id }
  } catch (e) {
    console.error('[pagos] registrarPago error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

export interface AprobarState {
  error?: string
  success?: boolean
}

/**
 * Aprueba un pago pendiente (admin/cajero).
 * 1. Payment → APROBADO
 * 2. Membership → ACTIVA (fechaInicio, fechaVencimiento +30d, lavadosRestantes)
 * 3. Genera QR (estado=ACTIVO) para el cliente
 * 4. Crea Receipt de PAGO
 * 5. Envía notificaciones (pago aprobado + QR generado)
 * 6. Registra auditoría
 */
export async function aprobarPago(
  _prev: AprobarState,
  formData: FormData
): Promise<AprobarState> {
  try {
    const user = await getUser()
    if (!user || !ADMIN_ROLES.includes(user.metadata.role)) {
      return { error: 'No autorizado.' }
    }

    const paymentId = String(formData.get('paymentId') ?? '')
    const observaciones = String(formData.get('observaciones') ?? '').trim() || null

    if (!paymentId) return { error: 'Pago no válido.' }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: {
            membership: {
              include: { plan: true, cliente: { include: { company: true } } },
            },
          },
        })
        if (!payment) throw new Error('Pago no encontrado.')
        if (payment.estado !== 'PENDIENTE') {
          throw new Error('Este pago ya fue procesado.')
        }

        // Company scoping
        if (
          user.metadata.role !== 'SUPERADMIN' &&
          user.metadata.companyId &&
          payment.membership.cliente.companyId !== user.metadata.companyId
        ) {
          throw new Error('Pago de otra empresa.')
        }

        const now = new Date()
        const fechaVencimiento = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000
        )

        // 1. Payment → APROBADO
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            estado: 'APROBADO',
            confirmadoPorId: user.metadata.dbUserId,
            fechaConfirmacion: now,
            observaciones,
          },
        })

        // 2. Membership → ACTIVA
        await tx.membership.update({
          where: { id: payment.membership.id },
          data: {
            estado: 'ACTIVA',
            fechaInicio: now,
            fechaVencimiento,
            lavadosRestantes: payment.membership.plan.lavadosIncluidos,
            pagoConfirmado: true, // legacy
            montoPagado: payment.monto, // legacy
          },
        })

        // 3. Generar QR (estado=ACTIVO)
        await tx.qrToken.create({
          data: {
            clienteId: payment.membership.cliente.id,
            membershipId: payment.membership.id,
            estado: 'ACTIVO',
            activo: true,
          },
        })

        // 4. Crear Receipt de PAGO
        const receipt = await createReceiptPago(tx, {
          paymentId: payment.id,
          clienteId: payment.membership.cliente.id,
          empresaId: payment.membership.cliente.company.id,
          sucursalId: user.metadata.sucursalId || undefined,
          empleadoId: user.metadata.dbUserId || undefined,
          monto: Number(payment.monto),
          datos: {
            cliente: payment.membership.cliente.nombre,
            empresa: payment.membership.cliente.company.name,
            plan: payment.membership.plan.nombre,
            metodo: payment.metodo,
            monto: Number(payment.monto),
            referencia: payment.referencia,
            aprobadoPor: user.email,
            fechaAprobacion: now.toISOString(),
          },
        })

        // Linkear receipt al payment
        await tx.payment.update({
          where: { id: payment.id },
          data: { receiptPagoId: receipt.id },
        })

        return {
          clienteId: payment.membership.cliente.id,
          clienteSupabaseId: payment.membership.cliente.supabaseId,
          planNombre: payment.membership.plan.nombre,
          monto: Number(payment.monto),
          metodo: payment.metodo,
          empresaId: payment.membership.cliente.company.id,
          receiptNumero: receipt.numero,
        }
      })

      // 5. Notificaciones (fuera de la transacción)
      try {
        const clienteUser = await prisma.user.findFirst({
          where: { supabaseId: result.clienteSupabaseId },
          select: { id: true },
        })
        if (clienteUser) {
          await notifyPagoAprobado(clienteUser.id, result.clienteId, {
            plan: result.planNombre,
            monto: result.monto,
            metodo: result.metodo,
          })
          await notifyQrGenerado(clienteUser.id, result.clienteId, {
            plan: result.planNombre,
          })
        }
      } catch (e) {
        console.error('[pagos] notification failed:', e)
      }

      // 6. Auditoría
      await logAudit({
        userId: user.metadata.dbUserId,
        empresaId: result.empresaId,
        sucursalId: user.metadata.sucursalId || undefined,
        accion: 'approve_payment',
        entidad: 'Payment',
        entidadId: paymentId,
        datosDespues: {
          estado: 'APROBADO',
          monto: result.monto,
          receiptNumero: result.receiptNumero,
        } as Prisma.InputJsonObject,
      })

      revalidatePath('/admin/pagos')
      revalidatePath('/admin/clientes')
      revalidatePath('/cliente/dashboard')

      return { success: true }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'No se pudo aprobar.' }
    }
  } catch (e) {
    console.error('[pagos] aprobarPago error:', e)
    return { error: 'Ocurrió un error inesperado.' }
  }
}

/**
 * Rechaza un pago pendiente (admin/cajero).
 * - Payment → RECHAZADO con motivo
 * - Membership → CANCELADA
 * - Notificación al cliente con el motivo
 * - Auditoría
 */
export async function rechazarPago(
  _prev: AprobarState,
  formData: FormData
): Promise<AprobarState> {
  try {
    const user = await getUser()
    if (!user || !ADMIN_ROLES.includes(user.metadata.role)) {
      return { error: 'No autorizado.' }
    }

    const paymentId = String(formData.get('paymentId') ?? '')
    const motivoRechazo = String(formData.get('motivoRechazo') ?? '').trim()

    if (!paymentId) return { error: 'Pago no válido.' }
    if (!motivoRechazo) return { error: 'Debes indicar el motivo del rechazo.' }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: {
            membership: {
              include: { plan: true, cliente: { include: { company: true } } },
            },
          },
        })
        if (!payment) throw new Error('Pago no encontrado.')
        if (payment.estado !== 'PENDIENTE') {
          throw new Error('Este pago ya fue procesado.')
        }

        // Company scoping
        if (
          user.metadata.role !== 'SUPERADMIN' &&
          user.metadata.companyId &&
          payment.membership.cliente.companyId !== user.metadata.companyId
        ) {
          throw new Error('Pago de otra empresa.')
        }

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            estado: 'RECHAZADO',
            confirmadoPorId: user.metadata.dbUserId,
            fechaConfirmacion: new Date(),
            motivoRechazo,
          },
        })

        await tx.membership.update({
          where: { id: payment.membership.id },
          data: { estado: 'CANCELADA' },
        })

        return {
          clienteId: payment.membership.cliente.id,
          clienteSupabaseId: payment.membership.cliente.supabaseId,
          planNombre: payment.membership.plan.nombre,
          empresaId: payment.membership.cliente.company.id,
        }
      })

      // Notificación
      try {
        const clienteUser = await prisma.user.findFirst({
          where: { supabaseId: result.clienteSupabaseId },
          select: { id: true },
        })
        if (clienteUser) {
          await notifyPagoRechazado(clienteUser.id, result.clienteId, {
            plan: result.planNombre,
            motivo: motivoRechazo,
          })
        }
      } catch (e) {
        console.error('[pagos] notification failed:', e)
      }

      // Auditoría
      await logAudit({
        userId: user.metadata.dbUserId,
        empresaId: result.empresaId,
        accion: 'reject_payment',
        entidad: 'Payment',
        entidadId: paymentId,
        datosDespues: {
          estado: 'RECHAZADO',
          motivo: motivoRechazo,
        } as Prisma.InputJsonObject,
      })

      revalidatePath('/admin/pagos')
      revalidatePath('/admin/clientes')

      return { success: true }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'No se pudo rechazar.' }
    }
  } catch (e) {
    console.error('[pagos] rechazarPago error:', e)
    return { error: 'Ocurrió un error inesperado.' }
  }
}
