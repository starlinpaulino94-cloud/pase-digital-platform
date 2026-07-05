'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { notificarAdmins } from '@/modules/notificaciones/actions'
import { formSubmitLimiter } from '@/lib/rate-limit'

export interface SeleccionState {
  error?: string
  success?: boolean
}

export async function seleccionarPlan(
  _prev: SeleccionState,
  formData: FormData
): Promise<SeleccionState> {
  try {
    const user = await getUser()
    if (!user || user.metadata.role !== 'CLIENTE' || !user.metadata.clienteId) {
      return { error: 'No autorizado.' }
    }

    // Rate limit form submissions to prevent spam
    const clientId = user.metadata.clienteId
    if (!formSubmitLimiter(clientId)) {
      return { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }
    }

    const planId = String(formData.get('planId') ?? '')
    if (!planId) return { error: 'Selecciona un plan.' }

    const cliente = await prisma.cliente.findUnique({
      where: { id: user.metadata.clienteId },
    })
    if (!cliente) return { error: 'Cliente no encontrado.' }

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    // Validate: plan must exist, belong to client's company, and be active
    if (!plan || plan.companyId !== cliente.companyId || !plan.activo) {
      return { error: 'Plan no válido para tu empresa.' }
    }

    // Block if there's already an active membership IN THIS COMPANY
    const existing = await prisma.membership.findUnique({
      where: {
        clienteId_companyId: {
          clienteId: cliente.id,
          companyId: cliente.companyId,
        },
      },
    })

    if (existing?.estado === 'ACTIVA') {
      return {
        error: 'Ya tienes una membresía activa en esta empresa. Espera a que venza para cambiar.',
      }
    }

    if (existing) {
      // Reuse existing membership (PENDIENTE or PENDIENTE_PAGO)
      await prisma.membership.update({
        where: { id: existing.id },
        data: { planId: plan.id, montoPagado: null, pagoConfirmado: false },
      })
    } else {
      // Create new membership with companyId
      await prisma.membership.create({
        data: {
          clienteId: cliente.id,
          companyId: cliente.companyId,
          planId: plan.id,
          userId: user.metadata.dbUserId || null,
          estado: 'PENDIENTE',
        },
      })
    }

    revalidatePath('/mis-membresias')
    revalidatePath('/cliente/dashboard')
    return { success: true }
  } catch (e) {
    console.error('[membresia] seleccionarPlan error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

export interface ComprobanteState {
  error?: string
  success?: boolean
}

/**
 * El cliente sube el comprobante de pago.
 * Cambia el estado de PENDIENTE → PENDIENTE_PAGO.
 */
export async function enviarComprobante(
  _prev: ComprobanteState,
  formData: FormData
): Promise<ComprobanteState> {
  const user = await getUser()
  if (!user || user.metadata.role !== 'CLIENTE' || !user.metadata.clienteId) {
    return { error: 'No autorizado.' }
  }

  // Rate limit form submissions to prevent spam
  const clientId = user.metadata.clienteId
  if (!formSubmitLimiter(clientId)) {
    return { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }
  }

  const membershipId = String(formData.get('membershipId') ?? '').trim()
  const comprobanteUrl = String(formData.get('comprobanteUrl') ?? '').trim()
  const metodoPagoId = String(formData.get('metodoPagoId') ?? '').trim() || null
  const nota = String(formData.get('nota') ?? '').trim() || null

  if (!membershipId) return { error: 'Membresía no especificada.' }
  if (!comprobanteUrl) return { error: 'Adjunta el comprobante de pago.' }

  // Verificar que la URL pertenezca al bucket de Supabase de esta plataforma.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const expectedPrefix = `${supabaseUrl}/storage/v1/object/public/comprobantes/`

  // Validar URL: debe pertenecer a Supabase y tener extensión válida
  if (!supabaseUrl || !comprobanteUrl.startsWith(expectedPrefix)) {
    return { error: 'URL del comprobante no válida.' }
  }

  // Validar que la URL tenga una extensión de archivo válida
  const url = new URL(comprobanteUrl)
  const pathname = url.pathname
  const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp']
  const hasValidExt = validExtensions.some(ext => pathname.toLowerCase().endsWith(ext))
  if (!hasValidExt) {
    return { error: 'Formato de archivo no permitido.' }
  }

  // Validar que la URL no contenga parámetros sospechosos
  if (url.search.includes('delete') || url.search.includes('token')) {
    return { error: 'URL del comprobante no válida.' }
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { cliente: true },
  })
  if (!membership) return { error: 'Membresía no encontrada.' }
  if (membership.clienteId !== user.metadata.clienteId) {
    return { error: 'No autorizado.' }
  }
  if (!['PENDIENTE', 'RECHAZADA'].includes(membership.estado)) {
    return { error: 'Solo puedes enviar comprobante en estado Pendiente o Rechazado.' }
  }

  await prisma.membership.update({
    where: { id: membershipId },
    data: {
      estado: 'PENDIENTE_PAGO',
      comprobanteUrl,
      comprobanteNota: nota,
      metodoPagoId: metodoPagoId || null,
      rechazadoReason: null,
    },
  })

  // Notify admins of this company
  await notificarAdmins(membership.cliente.companyId, {
    tipo: 'NUEVO_COMPROBANTE',
    titulo: 'Nuevo comprobante de pago',
    mensaje: `${membership.cliente.nombre} envió un comprobante para su membresía. Revísalo para activarla.`,
    href: `/admin/pagos`,
  })

  revalidatePath('/cliente/membresia')
  revalidatePath('/cliente/dashboard')
  return { success: true }
}
