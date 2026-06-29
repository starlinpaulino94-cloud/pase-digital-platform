import { prisma } from '@/lib/prisma'
import type { SessionUser } from '@/types'

/** companyId filter: superadmin gets undefined (all), admin gets their company. */
export function companyFilter(user: SessionUser): string | undefined {
  if (user.metadata.role === 'SUPERADMIN') return undefined
  return user.metadata.companyId ?? '__none__'
}

export async function adminMetrics(user: SessionUser) {
  const companyId = companyFilter(user)
  const clienteWhere = companyId ? { companyId } : {}
  const membershipWhere = companyId
    ? { cliente: { companyId } }
    : {}
  const visitWhere = companyId ? { cliente: { companyId } } : {}

  const [totalClientes, activas, pendientes, visitasHoy] = await Promise.all([
    prisma.cliente.count({ where: clienteWhere }),
    prisma.membership.count({
      where: { ...membershipWhere, estado: 'ACTIVA' },
    }),
    prisma.membership.count({
      where: { ...membershipWhere, estado: 'PENDIENTE' },
    }),
    prisma.visit.count({
      where: {
        ...visitWhere,
        fechaVisita: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ])

  return { totalClientes, activas, pendientes, visitasHoy }
}

export interface ReportePorPlan {
  plan: string
  count: number
}

export interface ClienteFrecuente {
  clienteId: string
  nombre: string
  visitas: number
}

export interface MembresiaPorVencer {
  id: string
  cliente: string
  plan: string
  fechaVencimiento: Date | null
}

export interface ReportesData {
  ingresosMes: number
  activasPorPlan: ReportePorPlan[]
  lavadosMes: number
  clientesFrecuentes: ClienteFrecuente[]
  membresiasPorVencer: MembresiaPorVencer[]
}

/** All admin reports in one call. companyId undefined => all companies. */
export async function getReportesAdmin(
  companyId: string | undefined
): Promise<ReportesData> {
  const membershipWhere = companyId ? { cliente: { companyId } } : {}
  const visitWhere = companyId ? { cliente: { companyId } } : {}

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const in7Days = new Date(now)
  in7Days.setDate(in7Days.getDate() + 7)

  const [ingresosAgg, activas, lavadosMes, visitasPorCliente, porVencer] =
    await Promise.all([
      prisma.membership.aggregate({
        _sum: { montoPagado: true },
        where: {
          ...membershipWhere,
          pagoConfirmado: true,
          updatedAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.membership.findMany({
        where: { ...membershipWhere, estado: 'ACTIVA' },
        include: { plan: { select: { nombre: true } } },
      }),
      prisma.visit.count({
        where: {
          ...visitWhere,
          fechaVisita: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.visit.groupBy({
        by: ['clienteId'],
        where: visitWhere,
        _count: { _all: true },
        orderBy: { _count: { clienteId: 'desc' } },
        take: 5,
      }),
      prisma.membership.findMany({
        where: {
          ...membershipWhere,
          estado: 'ACTIVA',
          fechaVencimiento: { gte: now, lte: in7Days },
        },
        include: {
          plan: { select: { nombre: true } },
          cliente: { select: { nombre: true } },
        },
        orderBy: { fechaVencimiento: 'asc' },
      }),
    ])

  const planCounts = new Map<string, number>()
  for (const m of activas) {
    const nombre = m.plan.nombre
    planCounts.set(nombre, (planCounts.get(nombre) ?? 0) + 1)
  }
  const activasPorPlan: ReportePorPlan[] = Array.from(planCounts.entries())
    .map(([plan, count]) => ({ plan, count }))
    .sort((a, b) => b.count - a.count)

  let clientesFrecuentes: ClienteFrecuente[] = []
  if (visitasPorCliente.length > 0) {
    const clientes = await prisma.cliente.findMany({
      where: { id: { in: visitasPorCliente.map((v) => v.clienteId) } },
      select: { id: true, nombre: true },
    })
    const nombreMap = new Map(clientes.map((c) => [c.id, c.nombre]))
    clientesFrecuentes = visitasPorCliente.map((v) => ({
      clienteId: v.clienteId,
      nombre: nombreMap.get(v.clienteId) ?? 'Cliente',
      visitas: v._count._all,
    }))
  }

  return {
    ingresosMes: Number(ingresosAgg._sum.montoPagado ?? 0),
    activasPorPlan,
    lavadosMes,
    clientesFrecuentes,
    membresiasPorVencer: porVencer.map((m) => ({
      id: m.id,
      cliente: m.cliente.nombre,
      plan: m.plan.nombre,
      fechaVencimiento: m.fechaVencimiento,
    })),
  }
}

export interface ReportesGlobales {
  total: ReportesData
  empresas: { companyId: string; nombre: string; data: ReportesData }[]
}

/** Global reports (superadmin): overall plus per-company breakdown. */
export async function getReportesGlobales(): Promise<ReportesGlobales> {
  const [total, companies] = await Promise.all([
    getReportesAdmin(undefined),
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
  ])

  const empresas = await Promise.all(
    companies.map(async (c) => ({
      companyId: c.id,
      nombre: c.name,
      data: await getReportesAdmin(c.id),
    }))
  )

  return { total, empresas }
}
