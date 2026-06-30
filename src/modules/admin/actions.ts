'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { crearNotificacion, notificarAdmins } from '@/modules/notificaciones/actions'

async function requireAdmin() {
  const user = await getUser()
  if (!user || !['ADMIN_EMPRESA', 'SUPERADMIN'].includes(user.metadata.role)) {
    return null
  }
  return user
}

async function getRequestMeta() {
  const h = await headers()
  return {
    ipAddress: h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? null,
    userAgent: h.get('user-agent') ?? null,
  }
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

function periodEnd(from: Date, dias = 30) {
  const d = new Date(from)
  d.setDate(d.getDate() + dias)
  return d
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

  const membershipId = String(formData.get('membershipId') ?? '')
  const montoRaw = String(formData.get('monto') ?? '').trim()
  const meta = await getRequestMeta()

  const membership = await assertOwnership(membershipId, user)
  if (!membership) return { error: 'Membresía no encontrada.' }
  if (membership.estado === 'ACTIVA') {
    return { error: 'La membresía ya está activa.' }
  }

  const now = new Date()
  const monto = montoRaw ? Number(montoRaw) : Number(membership.plan.precio)
  const vigenciaDias = membership.plan.vigenciaDias ?? 30

  await prisma.$transaction(async (tx) => {
    // 1. Activate membership
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
        rechazadoReason: null,
      },
    })

    // 2. Generate QR only if the client doesn't have one yet
    const existingQr = await tx.qrToken.findFirst({
      where: { clienteId: membership.clienteId, activo: true },
    })
    if (!existingQr) {
      await tx.qrToken.create({
        data: { clienteId: membership.clienteId },
      })
    }

    // 3. Audit log
    await tx.auditLog.create({
      data: {
        companyId: membership.cliente.companyId,
        userId: user.metadata.dbUserId ?? null,
        accion: 'PAGO_APROBADO',
        entidadTipo: 'Membership',
        entidadId: membership.id,
        payload: {
          planId: membership.planId,
          clienteId: membership.clienteId,
          monto: Number.isNaN(monto) ? Number(membership.plan.precio) : monto,
        },
        ...meta,
      },
    })
  })

  // Notify the client
  const clienteUser = await prisma.user.findUnique({
    where: { supabaseId: membership.cliente.supabaseId },
    select: { id: true },
  })
  if (clienteUser) {
    await crearNotificacion({
      userId: clienteUser.id,
      tipo: 'PAGO_APROBADO',
      titulo: '¡Tu membresía está activa!',
      mensaje: `Tu pago para el plan "${membership.plan.nombre}" fue confirmado. Ya puedes usar tu membresía.`,
      href: '/cliente/membresia',
    })
  }

  revalidatePath(`/admin/clientes/${membership.clienteId}`)
  revalidatePath('/admin/clientes')
  revalidatePath('/admin/dashboard')
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

    await prisma.membership.update({
      where: { id: membership.id },
      data: { estado: 'CANCELADA' },
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

  // Notify the client
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
  revalidatePath('/superadmin/membresias')
  return { success: true }
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
