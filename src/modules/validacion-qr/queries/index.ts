import { prisma } from '@/lib/prisma'
import type { ValidationSession, ValidationStatus } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const VALIDATION_INCLUDE = {
  digitalPass: { select: { id: true, token: true, isActive: true } },
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: { select: { email: true } },
    },
  },
  promotionAssignment: {
    select: {
      id: true,
      status: true,
      usesConsumed: true,
      usesAllowed: true,
      promotion: { select: { id: true, name: true, type: true } },
    },
  },
  receipt: true,
}

export async function getValidationById(id: string): Promise<ValidationSession | null> {
  return db.validation.findUnique({ where: { id }, include: VALIDATION_INCLUDE })
}

export async function getValidationBySessionId(sessionId: string): Promise<ValidationSession | null> {
  return db.validation.findUnique({ where: { sessionId }, include: VALIDATION_INCLUDE })
}

export async function listCompanyValidations(
  companyId: string,
  params?: {
    status?: ValidationStatus
    page?: number
    pageSize?: number
  }
): Promise<{ items: ValidationSession[]; total: number }> {
  const { status, page = 1, pageSize = 30 } = params ?? {}

  const where: Record<string, unknown> = { companyId }
  if (status) where.status = status

  const [items, total] = await Promise.all([
    db.validation.findMany({
      where,
      orderBy: { scannedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: VALIDATION_INCLUDE,
    }),
    db.validation.count({ where }),
  ])

  return { items, total }
}

export async function listCustomerValidations(
  customerId: string,
  params?: { page?: number; pageSize?: number }
): Promise<{ items: ValidationSession[]; total: number }> {
  const { page = 1, pageSize = 30 } = params ?? {}

  const where = { customerId }

  const [items, total] = await Promise.all([
    db.validation.findMany({
      where,
      orderBy: { scannedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: VALIDATION_INCLUDE,
    }),
    db.validation.count({ where }),
  ])

  return { items, total }
}

export async function getDigitalPassByToken(token: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db as any).digitalPass.findUnique({
    where: { token },
    include: {
      customer: {
        include: {
          user: { select: { email: true } },
          promotionAssignments: {
            where: { status: 'ACTIVE' },
            include: {
              promotion: { select: { id: true, name: true, type: true } },
            },
          },
        },
      },
    },
  })
}
