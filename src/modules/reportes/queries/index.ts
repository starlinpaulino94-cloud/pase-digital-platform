import { prisma } from '@/lib/prisma'

// Visits per day for the last N days for a company
export async function getVisitasPorDia(
  companyId: string | undefined,
  days = 7
): Promise<{ fecha: string; total: number }[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - (days - 1))
  desde.setHours(0, 0, 0, 0)

  const where = companyId
    ? { cliente: { companyId }, fechaVisita: { gte: desde } }
    : { fechaVisita: { gte: desde } }

  const visitas = await prisma.visit.findMany({
    where,
    select: { fechaVisita: true },
    orderBy: { fechaVisita: 'asc' },
  })

  const map: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(desde)
    d.setDate(d.getDate() + i)
    map[d.toISOString().slice(0, 10)] = 0
  }

  for (const v of visitas) {
    const key = new Date(v.fechaVisita).toISOString().slice(0, 10)
    if (map[key] !== undefined) map[key]++
  }

  return Object.entries(map).map(([fecha, total]) => ({ fecha, total }))
}

// Membership breakdown by estado for a company
export async function getMembresiasPorEstado(
  companyId: string | undefined
): Promise<{ estado: string; total: number }[]> {
  const estados = [
    { key: 'ACTIVA', label: 'Activas' },
    { key: 'PENDIENTE', label: 'Pendiente' },
    { key: 'VENCIDA', label: 'Vencidas' },
    { key: 'CANCELADA', label: 'Canceladas' },
  ] as const

  const clienteWhere = companyId ? { cliente: { companyId } } : {}

  const counts = await Promise.all(
    estados.map((e) =>
      prisma.membership.count({ where: { ...clienteWhere, estado: e.key } })
    )
  )

  return estados.map((e, i) => ({ estado: e.label, total: counts[i] }))
}

// New clientes registered in last N days globally or per company
export async function getNuevosClientesPorDia(
  companyId: string | undefined,
  days = 7
): Promise<{ fecha: string; total: number }[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - (days - 1))
  desde.setHours(0, 0, 0, 0)

  const where = companyId
    ? { companyId, createdAt: { gte: desde } }
    : { createdAt: { gte: desde } }

  const clientes = await prisma.cliente.findMany({
    where,
    select: { createdAt: true },
  })

  const map: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(desde)
    d.setDate(d.getDate() + i)
    map[d.toISOString().slice(0, 10)] = 0
  }

  for (const c of clientes) {
    const key = new Date(c.createdAt).toISOString().slice(0, 10)
    if (map[key] !== undefined) map[key]++
  }

  return Object.entries(map).map(([fecha, total]) => ({ fecha, total }))
}

// Top companies by visit count
export async function getTopEmpresasPorVisitas(
  limit = 5
): Promise<{ nombre: string; total: number }[]> {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: {
      name: true,
      clientes: { select: { visits: { select: { id: true } } } },
    },
  })

  return companies
    .map((c) => ({
      nombre: c.name,
      total: c.clientes.reduce((s, cl) => s + cl.visits.length, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}
