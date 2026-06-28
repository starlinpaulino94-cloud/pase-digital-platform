import { prisma } from '@/lib/prisma'
import type { Company, Branch, CompanyStatus } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function listAllCompanies(params?: {
  status?: CompanyStatus
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Company[]; total: number }> {
  const { status, search, page = 1, pageSize = 20 } = params ?? {}

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { legalName: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    db.company.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { branches: true, employees: true } },
        settings: true,
      },
    }),
    db.company.count({ where }),
  ])

  return { items, total }
}

export async function getCompanyById(id: string): Promise<Company | null> {
  return db.company.findUnique({
    where: { id },
    include: {
      settings: true,
      _count: { select: { branches: true, employees: true } },
    },
  })
}

export async function listBranchesByCompany(companyId: string): Promise<Branch[]> {
  return db.branch.findMany({
    where: { companyId },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { employees: true } },
    },
  })
}

export async function getBranchById(id: string): Promise<Branch | null> {
  return db.branch.findUnique({
    where: { id },
    include: { company: { select: { name: true } } },
  })
}

export async function listAuditLogs(params?: {
  companyId?: string
  event?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Record<string, unknown>[]; total: number }> {
  const { companyId, event, page = 1, pageSize = 50 } = params ?? {}

  const where: Record<string, unknown> = {}
  if (companyId) where.companyId = companyId
  if (event) where.event = { contains: event, mode: 'insensitive' }

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { email: true, name: true } },
        company: { select: { name: true } },
      },
    }),
    db.auditLog.count({ where }),
  ])

  return { items, total }
}
