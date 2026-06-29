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
  vehicle: {
    select: { id: true, make: true, model: true, year: true, color: true, plate: true },
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
    fromDate?: string
    page?: number
    pageSize?: number
  }
): Promise<{ items: ValidationSession[]; total: number }> {
  const { status, fromDate, page = 1, pageSize = 30 } = params ?? {}

  const where: Record<string, unknown> = { companyId }
  if (status) where.status = status
  if (fromDate) where.scannedAt = { gte: new Date(fromDate) }

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
  return db.digitalPass.findFirst({
    where: { token, isActive: true },
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
