'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, requireCompanyAccess, requireSelfAccess } from '@/lib/auth/guards'
import type { ActionResult } from '@/types/auth'
import { createCustomerSchema, updateCustomerSchema } from '../validations'
import {
  createCustomer,
  updateCustomer,
  setCustomerStatus,
  linkCustomerToCompany,
  regenerateDigitalPass,
  revokeDigitalPass,
} from '../mutations'
import { getCustomerById, getCustomerByUserId, emailExistsAsUser, customerLinkedToCompany, getActivePass } from '../queries'
import type { Customer, CustomerStatus, DigitalPass } from '../types'

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createCustomerAction(
  targetCompanyId: string,
  _prev: ActionResult<Customer>,
  formData: FormData
): Promise<ActionResult<Customer>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')

    const companyId = user.role === 'SUPERADMIN' ? targetCompanyId : user.companyId!
    if (user.role !== 'SUPERADMIN') await requireCompanyAccess(companyId)

    const raw = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
    }

    const parsed = createCustomerSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const exists = await emailExistsAsUser(parsed.data.email)
    if (exists) {
      return { success: false, error: 'Ya existe un usuario con ese email.', fieldErrors: { email: ['Email ya registrado'] } }
    }

    const customer = await createCustomer({
      ...parsed.data,
      companyId,
      actorUserId: user.dbUserId,
    })

    revalidatePath('/dashboard/clientes')
    revalidatePath('/admin/clientes')
    return { success: true, data: customer }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateCustomerAction(
  customerId: string,
  _prev: ActionResult<Customer>,
  formData: FormData
): Promise<ActionResult<Customer>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')

    const existing = await getCustomerById(customerId)
    if (!existing) return { success: false, error: 'Cliente no encontrado' }

    // ADMIN_EMPRESA can only update customers linked to their company
    if (user.role === 'ADMIN_EMPRESA') {
      const linked = await customerLinkedToCompany(customerId, user.companyId!)
      if (!linked) return { success: false, error: 'Cliente no pertenece a su empresa.' }
    }

    const raw = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
    }

    const parsed = updateCustomerSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const updated = await updateCustomer(
      customerId,
      parsed.data,
      user.dbUserId,
      user.companyId
    )

    revalidatePath(`/dashboard/clientes/${customerId}`)
    revalidatePath(`/admin/clientes/${customerId}`)
    return { success: true, data: updated }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function setCustomerStatusAction(
  customerId: string,
  status: CustomerStatus
): Promise<ActionResult> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')

    const existing = await getCustomerById(customerId)
    if (!existing) return { success: false, error: 'Cliente no encontrado' }

    if (user.role === 'ADMIN_EMPRESA') {
      const linked = await customerLinkedToCompany(customerId, user.companyId!)
      if (!linked) return { success: false, error: 'No autorizado.' }
    }

    await setCustomerStatus(customerId, status, user.dbUserId, user.companyId)

    revalidatePath('/dashboard/clientes')
    revalidatePath('/admin/clientes')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Link to company ─────────────────────────────────────────────────────────

export async function linkCustomerToCompanyAction(
  customerId: string,
  companyId: string
): Promise<ActionResult> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')

    if (user.role !== 'SUPERADMIN') await requireCompanyAccess(companyId)

    const already = await customerLinkedToCompany(customerId, companyId)
    if (already) return { success: false, error: 'El cliente ya está asociado a esta empresa.' }

    await linkCustomerToCompany(customerId, companyId, user.dbUserId)

    revalidatePath(`/dashboard/clientes/${customerId}`)
    revalidatePath(`/admin/clientes/${customerId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Digital Pass ─────────────────────────────────────────────────────────────

export async function regeneratePassAction(customerId: string): Promise<ActionResult<DigitalPass>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')

    if (user.role === 'ADMIN_EMPRESA') {
      const linked = await customerLinkedToCompany(customerId, user.companyId!)
      if (!linked) return { success: false, error: 'No autorizado.' }
    }

    const pass = await regenerateDigitalPass(customerId, user.dbUserId)

    revalidatePath(`/profile/pase`)
    revalidatePath(`/admin/clientes/${customerId}`)
    return { success: true, data: pass }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function revokePassAction(passId: string, reason: string): Promise<ActionResult> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')

    await revokeDigitalPass(passId, reason, user.dbUserId)

    revalidatePath('/profile/pase')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Customer self-actions ────────────────────────────────────────────────────

export async function updateProfileSelfAction(
  _prev: ActionResult<Customer>,
  formData: FormData
): Promise<ActionResult<Customer>> {
  try {
    const user = await requireRole('CLIENTE')
    if (!user.dbUserId) return { success: false, error: 'No autenticado' }

    const customer = await getCustomerByUserId(user.dbUserId)
    if (!customer) return { success: false, error: 'Perfil no encontrado' }

    const raw = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
    }

    const parsed = updateCustomerSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const updated = await updateCustomer(customer.id, parsed.data, user.dbUserId)

    revalidatePath('/profile')
    return { success: true, data: updated }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function getMyPassAction(customerId: string): Promise<ActionResult<DigitalPass>> {
  try {
    await requireSelfAccess(customerId)
    const pass = await getActivePass(customerId)
    if (!pass) return { success: false, error: 'No tienes un Pase Digital activo.' }
    return { success: true, data: pass }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}
