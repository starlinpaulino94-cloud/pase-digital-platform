import { prisma } from '@/lib/prisma'

export async function getClienteFull(clienteId: string) {
  return prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      company: true,
      qrTokens: { where: { activo: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      vehiculos: true,
      memberships: {
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      },
      visits: {
        include: { vehiculo: true },
        orderBy: { fechaVisita: 'desc' },
        take: 10,
      },
    },
  })
}

export async function getVisitHistory(clienteId: string) {
  return prisma.visit.findMany({
    where: { clienteId },
    include: { vehiculo: true },
    orderBy: { fechaVisita: 'desc' },
    take: 100,
  })
}

export async function getClienteBasic(clienteId: string) {
  return prisma.cliente.findUnique({
    where: { id: clienteId },
    include: { company: true },
  })
}

export function activeMembership<
  T extends { estado: string; fechaVencimiento: Date | null }
>(memberships: T[]): T | undefined {
  return memberships.find(
    (m) =>
      m.estado === 'ACTIVA' &&
      (!m.fechaVencimiento || m.fechaVencimiento > new Date())
  )
}
