import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// Returns validations per day for the last N days for a company
export async function getValidacionesPorDia(
  companyId: string,
  days = 7
): Promise<{ fecha: string; total: number; confirmadas: number }[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - (days - 1))
  desde.setHours(0, 0, 0, 0)

  const validaciones = await db.validation.findMany({
    where: {
      companyId,
      scannedAt: { gte: desde },
    },
    select: { scannedAt: true, status: true },
    orderBy: { scannedAt: 'asc' },
  })

  // Build a map day → counts
  const map: Record<string, { total: number; confirmadas: number }> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(desde)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    map[key] = { total: 0, confirmadas: 0 }
  }

  for (const v of validaciones) {
    const key = new Date(v.scannedAt).toISOString().slice(0, 10)
    if (map[key]) {
      map[key].total++
      if (v.status === 'CONFIRMED') map[key].confirmadas++
    }
  }

  return Object.entries(map).map(([fecha, counts]) => ({ fecha, ...counts }))
}

// Returns validations per day across all companies (global)
export async function getValidacionesGlobalesPorDia(
  days = 30
): Promise<{ fecha: string; total: number; confirmadas: number }[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - (days - 1))
  desde.setHours(0, 0, 0, 0)

  const validaciones = await db.validation.findMany({
    where: { scannedAt: { gte: desde } },
    select: { scannedAt: true, status: true },
    orderBy: { scannedAt: 'asc' },
  })

  const map: Record<string, { total: number; confirmadas: number }> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(desde)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    map[key] = { total: 0, confirmadas: 0 }
  }

  for (const v of validaciones) {
    const key = new Date(v.scannedAt).toISOString().slice(0, 10)
    if (map[key]) {
      map[key].total++
      if (v.status === 'CONFIRMED') map[key].confirmadas++
    }
  }

  return Object.entries(map).map(([fecha, counts]) => ({ fecha, ...counts }))
}

// Returns top companies by validation count
export async function getTopEmpresasPorValidaciones(
  limit = 5
): Promise<{ nombre: string; total: number }[]> {
  const companies = await db.company.findMany({
    where: { status: 'ACTIVE' },
    select: {
      name: true,
      _count: { select: { validations: true } },
    },
    orderBy: { validations: { _count: 'desc' } },
    take: limit,
  })

  return companies.map((c: { name: string; _count: { validations: number } }) => ({
    nombre: c.name,
    total: c._count.validations,
  }))
}

// Returns assignment status breakdown for a company
export async function getAsignacionesPorEstado(
  companyId: string
): Promise<{ estado: string; total: number }[]> {
  const estados = [
    { key: 'ACTIVE', label: 'Activas' },
    { key: 'PENDING_PAYMENT', label: 'Pendiente pago' },
    { key: 'COMPLETED', label: 'Completadas' },
    { key: 'EXPIRED', label: 'Expiradas' },
    { key: 'CANCELLED', label: 'Canceladas' },
  ]

  const counts = await Promise.all(
    estados.map((e) =>
      db.promotionAssignment.count({ where: { companyId, status: e.key } })
    )
  )

  return estados.map((e, i) => ({ estado: e.label, total: counts[i] as number }))
}

// New customers registered in last N days
export async function getNuevosClientesPorDia(
  days = 7
): Promise<{ fecha: string; total: number }[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - (days - 1))
  desde.setHours(0, 0, 0, 0)

  const customers = await db.customer.findMany({
    where: { createdAt: { gte: desde } },
    select: { createdAt: true },
  })

  const map: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(desde)
    d.setDate(d.getDate() + i)
    map[d.toISOString().slice(0, 10)] = 0
  }

  for (const c of customers) {
    const key = new Date(c.createdAt).toISOString().slice(0, 10)
    if (map[key] !== undefined) map[key]++
  }

  return Object.entries(map).map(([fecha, total]) => ({ fecha, total }))
}
