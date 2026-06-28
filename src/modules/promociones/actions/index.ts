'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, requireCompanyAccess } from '@/lib/auth/guards'
import type { ActionResult } from '@/types/auth'
import { createPromotionSchema, updatePromotionSchema } from '../validations'
import {
  createPromotion,
  updatePromotion,
  publishPromotion,
  pausePromotion,
  archivePromotion,
  duplicatePromotion,
} from '../mutations'
import { getPromotionById, promotionBelongsToCompany } from '../queries'
import type { Promotion } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveCompanyId(
  user: Awaited<ReturnType<typeof requireRole>>,
  targetCompanyId?: string
): Promise<string> {
  if (user.role === 'SUPERADMIN') {
    if (!targetCompanyId) throw new Error('companyId requerido para SUPERADMIN')
    return targetCompanyId
  }
  await requireCompanyAccess(user.companyId!)
  return user.companyId!
}

async function assertPromotionAccess(
  user: Awaited<ReturnType<typeof requireRole>>,
  promotionId: string
): Promise<void> {
  if (user.role === 'SUPERADMIN') return
  const linked = await promotionBelongsToCompany(promotionId, user.companyId!)
  if (!linked) throw new Error('No autorizado.')
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createPromotionAction(
  targetCompanyId: string,
  _prev: ActionResult<Promotion>,
  formData: FormData
): Promise<ActionResult<Promotion>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')
    const companyId = await resolveCompanyId(user, targetCompanyId)

    const configRaw = formData.get('config')
    const raw = {
      name: formData.get('name'),
      description: formData.get('description'),
      type: formData.get('type'),
      config: configRaw ? JSON.parse(configRaw as string) : {},
      maxUses: formData.get('maxUses') || undefined,
      startsAt: formData.get('startsAt') || undefined,
      expiresAt: formData.get('expiresAt') || undefined,
    }

    const parsed = createPromotionSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const promotion = await createPromotion({
      ...parsed.data,
      companyId,
      actorUserId: user.dbUserId,
    })

    revalidatePath('/dashboard/promociones')
    revalidatePath('/admin/promociones')
    return { success: true, data: promotion }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updatePromotionAction(
  promotionId: string,
  _prev: ActionResult<Promotion>,
  formData: FormData
): Promise<ActionResult<Promotion>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')
    await assertPromotionAccess(user, promotionId)

    const existing = await getPromotionById(promotionId)
    if (!existing) return { success: false, error: 'Promoción no encontrada' }
    if (existing.status === 'CANCELLED') {
      return { success: false, error: 'No se puede editar una promoción archivada' }
    }

    const configRaw = formData.get('config')
    const raw = {
      name: formData.get('name') || undefined,
      description: formData.get('description'),
      config: configRaw ? JSON.parse(configRaw as string) : undefined,
      maxUses: formData.get('maxUses') || undefined,
      startsAt: formData.get('startsAt') || undefined,
      expiresAt: formData.get('expiresAt') || undefined,
    }

    const parsed = updatePromotionSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const promotion = await updatePromotion(
      promotionId,
      parsed.data,
      user.dbUserId,
      user.companyId ?? undefined
    )

    revalidatePath(`/dashboard/promociones/${promotionId}`)
    revalidatePath(`/admin/promociones/${promotionId}`)
    return { success: true, data: promotion }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// ─── Status transitions ───────────────────────────────────────────────────────

export async function publishPromotionAction(promotionId: string): Promise<ActionResult<Promotion>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')
    await assertPromotionAccess(user, promotionId)

    const promotion = await publishPromotion(promotionId, user.dbUserId, user.companyId ?? undefined)

    revalidatePath('/dashboard/promociones')
    revalidatePath(`/dashboard/promociones/${promotionId}`)
    revalidatePath('/admin/promociones')
    return { success: true, data: promotion }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function pausePromotionAction(promotionId: string): Promise<ActionResult<Promotion>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')
    await assertPromotionAccess(user, promotionId)

    const promotion = await pausePromotion(promotionId, user.dbUserId, user.companyId ?? undefined)

    revalidatePath('/dashboard/promociones')
    revalidatePath(`/dashboard/promociones/${promotionId}`)
    revalidatePath('/admin/promociones')
    return { success: true, data: promotion }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function archivePromotionAction(promotionId: string): Promise<ActionResult<Promotion>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')
    await assertPromotionAccess(user, promotionId)

    const promotion = await archivePromotion(promotionId, user.dbUserId, user.companyId ?? undefined)

    revalidatePath('/dashboard/promociones')
    revalidatePath(`/dashboard/promociones/${promotionId}`)
    revalidatePath('/admin/promociones')
    return { success: true, data: promotion }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function duplicatePromotionAction(
  promotionId: string,
  targetCompanyId?: string
): Promise<ActionResult<Promotion>> {
  try {
    const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')

    if (user.role !== 'SUPERADMIN') {
      await assertPromotionAccess(user, promotionId)
    }

    const companyId = user.role === 'SUPERADMIN' ? targetCompanyId : user.companyId!

    const promotion = await duplicatePromotion(promotionId, user.dbUserId, companyId)

    revalidatePath('/dashboard/promociones')
    revalidatePath('/admin/promociones')
    return { success: true, data: promotion }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}
