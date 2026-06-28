import { prisma } from '@/lib/prisma'
import type { Customer, CustomerStatus, DigitalPass } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const CUSTOMER_INCLUDE = {
  user: {
    select: { id: true, email: true, name: true, phone: true, avatarUrl: true },
  },
}

const CUSTOMER_INCLUDE_FULL = {
  ...CUSTOMER_INCLUDE,
  digitalPasses: {
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
  customerCompanies: {
    include: {
      company: { select: { id: true, name: true, industry: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
}

export async function listAllCustomers(params?: {
  status?: CustomerStatus
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Customer[]; total: number }> {
  const { status, search, page = 1, pageSize = 30 } = params ?? {}

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [items, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: CUSTOMER_INCLUDE,
    }),
    db.customer.count({ where }),
  ])

  return { items, total }
}

export async function listCustomersByCompany(
  companyId: string,
  params?: { search?: string; page?: number; pageSize?: number }
): Promise<{ items: Customer[]; total: number }> {
  const { search, page = 1, pageSize = 30 } = params ?? {}

  const where: Record<string, unknown> = {
    customerCompanies: { some: { companyId } },
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [items, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: CUSTOMER_INCLUDE,
    }),
    db.customer.count({ where }),
  ])

  return { items, total }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return db.customer.findUnique({
    where: { id },
    include: CUSTOMER_INCLUDE_FULL,
  })
}

export async function getCustomerByUserId(userId: string): Promise<Customer | null> {
  return db.customer.findUnique({
    where: { userId },
    include: CUSTOMER_INCLUDE_FULL,
  })
}

export async function getActivePass(customerId: string): Promise<DigitalPass | null> {
  return db.digitalPass.findFirst({
    where: { customerId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function emailExistsAsUser(email: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { email } })
  return !!user
}

export async function customerLinkedToCompany(
  customerId: string,
  companyId: string
): Promise<boolean> {
  const link = await db.customerCompany.findUnique({
    where: { customerId_companyId: { customerId, companyId } },
  })
  return !!link
}
