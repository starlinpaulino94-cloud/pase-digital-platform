'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import type { ActionResult } from '@/types/auth'
import { scanSchema, confirmSchema, rejectSchema } from '../validations'
import { scanQR, evaluateValidation, confirmValidation, rejectValidation } from '../mutations'
import { getValidationById } from '../queries'
import type { ValidationSession, Receipt } from '../types'

// ─── Scan ─────────────────────────────────────────────────────────────────────

export async function scanQRAction(
  _prev: ActionResult<{ validation: ValidationSession; alreadyScanned: boolean }>,
  formData: FormData
): Promise<ActionResult<{ validation: ValidationSession; alreadyScanned: boolean }>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')

    const raw = {
      token: formData.get('token'),
      companyId: formData.get('companyId') ?? user.companyId,
      branchId: formData.get('branchId') || undefined,
    }

    const parsed = scanSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // Use JWT companyId for non-superadmin (ignore client-supplied companyId)
    const companyId = user.role === 'SUPERADMIN' ? parsed.data.companyId : user.companyId!
    const branchId = user.branchId ?? parsed.data.branchId ?? null

    const result = await scanQR({
      token: parsed.data.token,
      companyId,
      branchId,
      employeeId: user.dbUserId,
    })

    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Evaluate ─────────────────────────────────────────────────────────────────

export async function evaluateValidationAction(
  validationId: string
): Promise<ActionResult<ValidationSession>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')

    const existing = await getValidationById(validationId)
    if (!existing) return { success: false, error: 'Validación no encontrada' }

    if (user.role !== 'SUPERADMIN' && existing.companyId !== user.companyId) {
      return { success: false, error: 'No autorizado.' }
    }

    const validation = await evaluateValidation(validationId, existing.companyId, user.dbUserId)
    return { success: true, data: validation }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Confirm ──────────────────────────────────────────────────────────────────

export async function confirmValidationAction(
  _prev: ActionResult<{ validation: ValidationSession; receipt: Receipt }>,
  formData: FormData
): Promise<ActionResult<{ validation: ValidationSession; receipt: Receipt }>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')

    const raw = {
      validationId: formData.get('validationId'),
      assignmentId: formData.get('assignmentId'),
      externalInvoiceId: formData.get('externalInvoiceId') || undefined,
      externalInvoiceUrl: formData.get('externalInvoiceUrl') || undefined,
    }

    const parsed = confirmSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await getValidationById(parsed.data.validationId)
    if (!existing) return { success: false, error: 'Validación no encontrada' }

    if (user.role !== 'SUPERADMIN' && existing.companyId !== user.companyId) {
      return { success: false, error: 'No autorizado.' }
    }

    const result = await confirmValidation({
      ...parsed.data,
      companyId: existing.companyId,
      employeeId: user.dbUserId,
    })

    revalidatePath(`/dashboard/validaciones/${parsed.data.validationId}`)
    revalidatePath(`/dashboard/clientes/${existing.customerId}`)
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Reject ───────────────────────────────────────────────────────────────────

export async function rejectValidationAction(
  _prev: ActionResult<ValidationSession>,
  formData: FormData
): Promise<ActionResult<ValidationSession>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')

    const raw = {
      validationId: formData.get('validationId'),
      reason: formData.get('reason'),
    }

    const parsed = rejectSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const existing = await getValidationById(parsed.data.validationId)
    if (!existing) return { success: false, error: 'Validación no encontrada' }

    if (user.role !== 'SUPERADMIN' && existing.companyId !== user.companyId) {
      return { success: false, error: 'No autorizado.' }
    }

    const validation = await rejectValidation(
      parsed.data.validationId,
      parsed.data.reason,
      existing.companyId,
      user.dbUserId
    )

    revalidatePath(`/dashboard/validaciones/${parsed.data.validationId}`)
    return { success: true, data: validation }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}
