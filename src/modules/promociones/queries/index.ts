import { prisma } from '@/lib/prisma'
import type { Promotion, PromotionStatus, PromotionType } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const PROMOTION_INCLUDE = {
  company: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { assignments: true } },
}

export async function listAllPromotions(params?: {
  status?: PromotionStatus
  type?: PromotionType
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Promotion[]; total: number }> {
  const { status, type, search, page = 1, pageSize = 30 } = params ?? {}

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (type) where.type = type
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    db.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: PROMOTION_INCLUDE,
    }),
    db.promotion.count({ where }),
  ])

  return { items, total }
}

export async function listCompanyPromotions(
  companyId: string,
  params?: {
    status?: PromotionStatus
    type?: PromotionType
    search?: string
    page?: number
    pageSize?: number
  }
): Promise<{ items: Promotion[]; total: number }> {
  const { status, type, search, page = 1, pageSize = 30 } = params ?? {}

  const where: Record<string, unknown> = { companyId }
  if (status) where.status = status
  if (type) where.type = type
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    db.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: PROMOTION_INCLUDE,
    }),
    db.promotion.count({ where }),
  ])

  return { items, total }
}

export async function getPromotionById(id: string): Promise<Promotion | null> {
  return db.promotion.findUnique({
    where: { id },
    include: PROMOTION_INCLUDE,
  })
}

export async function getActiveCompanyPromotions(companyId: string): Promise<Promotion[]> {
  return db.promotion.findMany({
    where: {
      companyId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    include: PROMOTION_INCLUDE,
  })
}

export async function promotionBelongsToCompany(
  promotionId: string,
  companyId: string
): Promise<boolean> {
  const promo = await db.promotion.findFirst({
    where: { id: promotionId, companyId },
    select: { id: true },
  })
  return !!promo
}
