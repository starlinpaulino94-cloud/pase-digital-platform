'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestMeta, periodEnd } from '@/lib/server-utils'
import { crearNotificacion, notificarAdmins } from '@/modules/notificaciones/actions'
import { procesarReferidoCompletado } from '@/modules/referidos/actions'
import { activarMembresia } from '@/modules/pagos/activacion'
import { paymentLimiter } from '@/lib/rate-limit'
import { ensureEmailIdentity } from '@/lib/supabase/identity'

async function requireAdmin() {
  const user = await getUser()
  if (!user || !['ADMIN_EMPRESA', 'SUPERADMIN'].includes(user.metadata.role)) {
    return null
  }
  return user
}

/** Ensure the membership belongs to the admin's company (superadmin = any). */
async function assertOwnership(
  membershipId: string,
  user: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>
) {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { plan: true, cliente: true },
  })
  if (!membership) return null
  if (
    user.metadata.role !== 'SUPERADMIN' &&
    user.metadata.companyId &&
    membership.cliente.companyId !== user.metadata.companyId
  ) {
    return null
  }
  return membership
}

export interface AdminActionState {
  error?: string
  success?: boolean
}

/**
 * Confirmar pago: PENDIENTE | PENDIENTE_PAGO -> ACTIVA.
 * Genera el QR del cliente si todavía no tiene uno activo.
 * Registra auditoría.
 */
export async function confirmarPago(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  // Rate limit payment confirmations to prevent spam
  const adminId = user.metadata.dbUserId || 'anonymous'
  if (!paymentLimiter(adminId)) {
    return { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }
  }

  const membershipId = String(formData.get('membershipId') ?? '')
  const meta = await getRequestMeta()

  const membership = await assertOwnership(membershipId, user)
  if (!membership) return { error: 'Membresía no encontrada.' }

  const result = await activarMembresia(membershipId, user.metadata.dbUserId ?? null, meta)
  if (!result.ok) return { error: result.error }

  const clienteUser = await prisma.user.findUnique({
    where: { supabaseId: result.supabaseId },
    select: { id: true },
  })
  if (clienteUser) {
    await crearNotificacion({
      userId: clienteUser.id,
      tipo: 'PAGO_APROBADO',
      titulo: '¡Tu membresía está activa!',
      mensaje: `Tu pago para el plan "${result.planNombre}" fue confirmado. Ya puedes usar tu membresía.`,
      href: '/cliente/membresia',
    })
  }

  if (result.esPrimera) {
    await procesarReferidoCompletado(result.clienteId, result.companyId)
  }

  revalidatePath(`/admin/clientes/${result.clienteId}`)
  revalidatePath('/admin/clientes')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/pagos')
  revalidatePath('/superadmin/membresias')
  return { success: true }
  } catch (e) {
    console.error('[admin] confirmarPago error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

/** Create a PENDIENTE membership for a cliente with the given plan. */
export async function crearMembresia(
  clienteId: string,
  planId: string,
  _companyId: string
): Promise<AdminActionState> {
  try {
    const user = await requireAdmin()
    if (!user) return { error: 'No autorizado.' }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    })
    if (!cliente) return { error: 'Cliente no encontrado.' }
    if (
      user.metadata.role !== 'SUPERADMIN' &&
      user.metadata.companyId &&
      cliente.companyId !== user.metadata.companyId
    ) {
      return { error: 'No autorizado.' }
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || plan.companyId !== cliente.companyId) {
      return { error: 'Plan no válido.' }
    }

    await prisma.membership.create({
      data: {
        clienteId,
        planId,
        estado: 'PENDIENTE',
        lavadosRestantes: plan.esIlimitado ? 0 : plan.lavadosIncluidos,
      },
    })

    revalidatePath(`/admin/clientes/${clienteId}`)
    revalidatePath('/admin/clientes')
    revalidatePath('/admin/membresias')
    return { success: true }
  } catch (e) {
    console.error('[admin] crearMembresia error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

/** Cancel a membership: estado -> CANCELADA. */
export async function cancelarMembresia(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const user = await requireAdmin()
    if (!user) return { error: 'No autorizado.' }

    const membershipId = String(formData.get('membershipId') ?? '')
    const membership = await assertOwnership(membershipId, user)
    if (!membership) return { error: 'Membresía no encontrada.' }
    if (membership.estado === 'CANCELADA') {
      return { error: 'La membresía ya está cancelada.' }
    }

    const meta = await getRequestMeta()
    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: membership.id },
        data: { estado: 'CANCELADA' },
      })
      await tx.auditLog.create({
        data: {
          companyId: membership.cliente.companyId,
          userId: user.metadata.dbUserId ?? null,
          accion: 'MEMBRESIA_CANCELADA',
          entidadTipo: 'Membership',
          entidadId: membership.id,
          payload: { clienteId: membership.clienteId, planId: membership.planId },
          ...meta,
        },
      })
    })

    revalidatePath(`/admin/clientes/${membership.clienteId}`)
    revalidatePath('/admin/clientes')
    revalidatePath('/admin/membresias')
    return { success: true }
  } catch (e) {
    console.error('[admin] cancelarMembresia error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

/**
 * Rechazar pago: PENDIENTE_PAGO -> RECHAZADA con motivo.
 */
export async function rechazarPago(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const user = await requireAdmin()
    if (!user) return { error: 'No autorizado.' }

    const membershipId = String(formData.get('membershipId') ?? '')
    const motivo = String(formData.get('motivo') ?? '').trim()
    const meta = await getRequestMeta()

    if (!motivo) return { error: 'Indica el motivo del rechazo.' }

    const membership = await assertOwnership(membershipId, user)
    if (!membership) return { error: 'Membresía no encontrada.' }

    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: membership.id },
        data: { estado: 'RECHAZADA', rechazadoReason: motivo },
      })

      await tx.auditLog.create({
        data: {
          companyId: membership.cliente.companyId,
          userId: user.metadata.dbUserId ?? null,
          accion: 'PAGO_RECHAZADO',
          entidadTipo: 'Membership',
          entidadId: membership.id,
          payload: { motivo, clienteId: membership.clienteId },
          ...meta,
        },
      })
    })

    const clienteUserRejected = await prisma.user.findUnique({
      where: { supabaseId: membership.cliente.supabaseId },
      select: { id: true },
    })
    if (clienteUserRejected) {
      await crearNotificacion({
        userId: clienteUserRejected.id,
        tipo: 'PAGO_RECHAZADO',
        titulo: 'Tu comprobante fue rechazado',
        mensaje: `Motivo: ${motivo}. Por favor sube un nuevo comprobante para continuar.`,
        href: '/cliente/membresia',
      })
    }

    revalidatePath(`/admin/clientes/${membership.clienteId}`)
    revalidatePath('/admin/clientes')
    revalidatePath('/admin/pagos')
    revalidatePath('/superadmin/membresias')
    return { success: true }
  } catch (e) {
    console.error('[admin] rechazarPago error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

/** Renovar: nuevo período, reset lavadosRestantes, mantiene QR. */
export async function renovarMembresia(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const membershipId = String(formData.get('membershipId') ?? '')
  const montoRaw = String(formData.get('monto') ?? '').trim()
  const meta = await getRequestMeta()

  const membership = await assertOwnership(membershipId, user)
  if (!membership) return { error: 'Membresía no encontrada.' }

  const ESTADOS_RENOVABLES = ['ACTIVA', 'VENCIDA']
  if (!ESTADOS_RENOVABLES.includes(membership.estado)) {
    return { error: `No se puede renovar una membresía en estado ${membership.estado}.` }
  }

  const now = new Date()
  const monto = montoRaw ? Number(montoRaw) : Number(membership.plan.precio)
  const vigenciaDias = membership.plan.vigenciaDias ?? 30

  await prisma.$transaction(async (tx) => {
    await tx.membership.update({
      where: { id: membership.id },
      data: {
        estado: 'ACTIVA',
        fechaInicio: now,
        fechaVencimiento: periodEnd(now, vigenciaDias),
        lavadosRestantes: membership.plan.esIlimitado
          ? 0
          : membership.plan.lavadosIncluidos,
        montoPagado: Number.isNaN(monto) ? Number(membership.plan.precio) : monto,
        pagoConfirmado: true,
      },
    })

    await tx.auditLog.create({
      data: {
        companyId: membership.cliente.companyId,
        userId: user.metadata.dbUserId ?? null,
        accion: 'MEMBRESIA_RENOVADA',
        entidadTipo: 'Membership',
        entidadId: membership.id,
        payload: { monto: Number.isNaN(monto) ? Number(membership.plan.precio) : monto },
        ...meta,
      },
    })
  })

  revalidatePath(`/admin/clientes/${membership.clienteId}`)
  revalidatePath('/admin/clientes')
  revalidatePath('/superadmin/membresias')
  return { success: true }
  } catch (e) {
    console.error('[admin] renovarMembresia error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

/** Create an EMPLEADO: Supabase auth user + DB User in the admin's company. */
export async function crearEmpleado(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const user = await requireAdmin()
    if (!user) return { error: 'No autorizado.' }

    const companyId = user.metadata.companyId
    if (!companyId) {
      return { error: 'Tu cuenta no está asociada a una empresa.' }
    }

    const nombre = String(formData.get('nombre') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const password = String(formData.get('password') ?? '')

    if (!nombre || !email || !password) {
      return { error: 'Todos los campos son obligatorios.' }
    }
    if (password.length < 6) {
      return { error: 'La contraseña debe tener al menos 6 caracteres.' }
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { error: 'Ya existe un usuario con ese correo.' }
    }

    const supabase = createAdminClient()
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (createError || !created.user) {
      console.error('[admin] crearEmpleado supabase error:', createError)
      return { error: 'No se pudo crear el usuario de acceso.' }
    }

    const supabaseId = created.user.id

    // Garantiza la fila de identity (email) para que el login funcione.
    await ensureEmailIdentity(supabaseId, email)

    let dbUser
    try {
      dbUser = await prisma.user.create({
        data: {
          supabaseId,
          email,
          name: nombre,
          role: 'EMPLEADO',
          companyId,
        },
      })
    } catch (e) {
      // Roll back the auth user so we don't leave an orphan.
      await supabase.auth.admin.deleteUser(supabaseId).catch(() => {})
      throw e
    }

    await supabase.auth.admin.updateUserById(supabaseId, {
      app_metadata: {
        role: 'EMPLEADO',
        dbUserId: dbUser.id,
        companyId,
      },
    })

    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (e) {
    console.error('[admin] crearEmpleado error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

/** Delete an EMPLEADO from Supabase auth and the DB. */
export async function eliminarEmpleado(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const user = await requireAdmin()
    if (!user) return { error: 'No autorizado.' }

    const empleadoId = String(formData.get('empleadoId') ?? '')
    const empleado = await prisma.user.findUnique({
      where: { id: empleadoId },
    })
    if (!empleado || empleado.role !== 'EMPLEADO') {
      return { error: 'Empleado no encontrado.' }
    }
    if (
      user.metadata.role !== 'SUPERADMIN' &&
      user.metadata.companyId &&
      empleado.companyId !== user.metadata.companyId
    ) {
      return { error: 'No autorizado.' }
    }

    const supabase = createAdminClient()
    const { error: delError } = await supabase.auth.admin.deleteUser(
      empleado.supabaseId
    )
    if (delError) {
      console.error('[admin] eliminarEmpleado supabase error:', delError)
    }

    await prisma.user.delete({ where: { id: empleado.id } })

    revalidatePath('/admin/empleados')
    return { success: true }
  } catch (e) {
    console.error('[admin] eliminarEmpleado error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

/**
 * Solicitar nueva evidencia: mantiene PENDIENTE_PAGO → RECHAZADA
 * pero con mensaje específico solicitando reenvío del comprobante.
 */
export async function solicitarNuevaEvidencia(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const membershipId = String(formData.get('membershipId') ?? '')
  const motivo = String(formData.get('motivo') ?? '').trim()
  const meta = await getRequestMeta()

  if (!motivo) return { error: 'Indica el motivo de la solicitud.' }

  const membership = await assertOwnership(membershipId, user)
  if (!membership) return { error: 'Membresía no encontrada.' }
  if (membership.estado !== 'PENDIENTE_PAGO') {
    return { error: 'Solo se puede solicitar nueva evidencia cuando hay un comprobante pendiente.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: membership.id },
        data: { estado: 'RECHAZADA', rechazadoReason: motivo, comprobanteUrl: null },
      })

      await tx.auditLog.create({
        data: {
          companyId: membership.cliente.companyId,
          userId: user.metadata.dbUserId ?? null,
          accion: 'PAGO_RECHAZADO',
          entidadTipo: 'Membership',
          entidadId: membership.id,
          payload: { motivo, tipo: 'solicitud_nueva_evidencia', clienteId: membership.clienteId },
          ...meta,
        },
      })
    })

    const clienteUser = await prisma.user.findUnique({
      where: { supabaseId: membership.cliente.supabaseId },
      select: { id: true },
    })
    if (clienteUser) {
      await crearNotificacion({
        userId: clienteUser.id,
        tipo: 'PAGO_RECHAZADO',
        titulo: 'Se requiere una nueva evidencia',
        mensaje: `El equipo revisó tu comprobante y necesita una imagen más clara. Motivo: ${motivo}. Por favor sube un nuevo comprobante.`,
        href: '/cliente/membresia',
      })
    }

    revalidatePath('/admin/pagos')
    revalidatePath(`/admin/clientes/${membership.clienteId}`)
    return { success: true }
  } catch (e) {
    console.error('[admin-evidence]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

/**
 * Guardar nota interna sobre una membresía (solo visible para admins).
 */
export async function guardarNotaInterna(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const membershipId = String(formData.get('membershipId') ?? '')
  const nota = String(formData.get('nota') ?? '').trim()

  const membership = await assertOwnership(membershipId, user)
  if (!membership) return { error: 'Membresía no encontrada.' }

  const meta = await getRequestMeta()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: membership.id },
        data: { adminNota: nota || null },
      })
      await tx.auditLog.create({
        data: {
          companyId: membership.cliente.companyId,
          userId: user.metadata.dbUserId ?? null,
          accion: 'NOTA_INTERNA',
          entidadTipo: 'Membership',
          entidadId: membership.id,
          payload: { nota: nota || null },
          ...meta,
        },
      })
    })

    revalidatePath('/admin/pagos')
    revalidatePath(`/admin/clientes/${membership.clienteId}`)
    return { success: true }
  } catch (e) {
    console.error('[admin-notes]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}
