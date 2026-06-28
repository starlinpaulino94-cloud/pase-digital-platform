import { prisma } from '@/lib/prisma'
import { writeAuditLog } from '@/modules/empresas/mutations'
import type { Promotion, PromotionConfig } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const PROMOTION_INCLUDE = {
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { assignments: true } },
}

export async function createPromotion(params: {
  companyId: string
  name: string
  description?: string | null
  type: string
  config: PromotionConfig
  maxUses?: number | null
  startsAt?: Date | null
  expiresAt?: Date | null
  actorUserId?: string
}): Promise<Promotion> {
  const { actorUserId, ...data } = params

  const promotion = await db.promotion.create({
    data: {
      ...data,
      status: 'DRAFT',
      createdById: actorUserId,
    },
    include: PROMOTION_INCLUDE,
  })

  await writeAuditLog({
    companyId: params.companyId,
    userId: actorUserId,
    event: 'PROMOTION_CREATED',
    entityType: 'Promotion',
    entityId: promotion.id,
    payload: { name: promotion.name, type: promotion.type },
  })

  return promotion
}

export async function updatePromotion(
  promotionId: string,
  data: {
    name?: string
    description?: string | null
    config?: PromotionConfig
    maxUses?: number | null
    startsAt?: Date | null
    expiresAt?: Date | null
  },
  actorUserId?: string,
  companyId?: string
): Promise<Promotion> {
  const promotion = await db.promotion.update({
    where: { id: promotionId },
    data,
    include: PROMOTION_INCLUDE,
  })

  await writeAuditLog({
    companyId: companyId ?? promotion.companyId,
    userId: actorUserId,
    event: 'PROMOTION_UPDATED',
    entityType: 'Promotion',
    entityId: promotionId,
    payload: { fields: Object.keys(data) },
  })

  return promotion
}

export async function publishPromotion(
  promotionId: string,
  actorUserId?: string,
  companyId?: string
): Promise<Promotion> {
  const promotion = await db.promotion.findUnique({ where: { id: promotionId } })
  if (!promotion) throw new Error('Promoción no encontrada')
  if (promotion.status !== 'DRAFT' && promotion.status !== 'PAUSED') {
    throw new Error('Solo se pueden publicar promociones en estado Borrador o Pausada')
  }

  const updated = await db.promotion.update({
    where: { id: promotionId },
    data: { status: 'ACTIVE' },
    include: PROMOTION_INCLUDE,
  })

  await writeAuditLog({
    companyId: companyId ?? updated.companyId,
    userId: actorUserId,
    event: 'PROMOTION_PUBLISHED',
    entityType: 'Promotion',
    entityId: promotionId,
    payload: { previousStatus: promotion.status },
  })

  return updated
}

export async function pausePromotion(
  promotionId: string,
  actorUserId?: string,
  companyId?: string
): Promise<Promotion> {
  const promotion = await db.promotion.findUnique({ where: { id: promotionId } })
  if (!promotion) throw new Error('Promoción no encontrada')
  if (promotion.status !== 'ACTIVE') {
    throw new Error('Solo se pueden pausar promociones activas')
  }

  const updated = await db.promotion.update({
    where: { id: promotionId },
    data: { status: 'PAUSED' },
    include: PROMOTION_INCLUDE,
  })

  await writeAuditLog({
    companyId: companyId ?? updated.companyId,
    userId: actorUserId,
    event: 'PROMOTION_PAUSED',
    entityType: 'Promotion',
    entityId: promotionId,
    payload: {},
  })

  return updated
}

export async function archivePromotion(
  promotionId: string,
  actorUserId?: string,
  companyId?: string
): Promise<Promotion> {
  const promotion = await db.promotion.findUnique({ where: { id: promotionId } })
  if (!promotion) throw new Error('Promoción no encontrada')
  if (promotion.status === 'CANCELLED') {
    throw new Error('La promoción ya está archivada')
  }

  const updated = await db.promotion.update({
    where: { id: promotionId },
    data: { status: 'CANCELLED' },
    include: PROMOTION_INCLUDE,
  })

  await writeAuditLog({
    companyId: companyId ?? updated.companyId,
    userId: actorUserId,
    event: 'PROMOTION_ARCHIVED',
    entityType: 'Promotion',
    entityId: promotionId,
    payload: { previousStatus: promotion.status },
  })

  return updated
}

export async function duplicatePromotion(
  promotionId: string,
  actorUserId?: string,
  targetCompanyId?: string
): Promise<Promotion> {
  const source = await db.promotion.findUnique({ where: { id: promotionId } })
  if (!source) throw new Error('Promoción no encontrada')

  const companyId = targetCompanyId ?? source.companyId

  const copy = await db.promotion.create({
    data: {
      companyId,
      name: `${source.name} (copia)`,
      description: source.description,
      type: source.type,
      status: 'DRAFT',
      config: source.config,
      maxUses: source.maxUses,
      startsAt: source.startsAt,
      expiresAt: source.expiresAt,
      createdById: actorUserId,
    },
    include: PROMOTION_INCLUDE,
  })

  await writeAuditLog({
    companyId,
    userId: actorUserId,
    event: 'PROMOTION_DUPLICATED',
    entityType: 'Promotion',
    entityId: copy.id,
    payload: { sourceId: promotionId, sourceName: source.name },
  })

  return copy
}

export async function deletePromotion(
  promotionId: string,
  actorUserId?: string,
  companyId?: string
): Promise<void> {
  const promotion = await db.promotion.findUnique({
    where: { id: promotionId },
    include: { _count: { select: { assignments: true } } },
  })
  if (!promotion) throw new Error('Promoción no encontrada')
  if (promotion.status !== 'DRAFT') {
    throw new Error('Solo se pueden eliminar promociones en estado Borrador')
  }
  if (promotion._count.assignments > 0) {
    throw new Error('No se puede eliminar una promoción con asignaciones')
  }

  await db.promotion.delete({ where: { id: promotionId } })

  await writeAuditLog({
    companyId: companyId ?? promotion.companyId,
    userId: actorUserId,
    event: 'PROMOTION_DELETED',
    entityType: 'Promotion',
    entityId: promotionId,
    payload: { name: promotion.name },
  })
}
