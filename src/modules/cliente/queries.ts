import { prisma } from '@/lib/prisma'

export async function getClienteFull(clienteId: string) {
  return prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      company: true,
      // Solo QR activos (estado=ACTIVO). El QR se genera al aprobar el pago.
      qrTokens: {
        where: { estado: 'ACTIVO' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      vehiculos: true,
      memberships: {
        include: { plan: true, metodoPago: true },
        orderBy: { createdAt: 'desc' },
      },
      visits: {
        include: { vehiculo: true, sucursal: true },
        orderBy: { fechaVisita: 'desc' },
        take: 10,
      },
    },
  })
}

export async function getClienteVisitas(
  clienteId: string,
  page = 1,
  pageSize = 20
) {
  const skip = (page - 1) * pageSize
  const [total, visitas] = await Promise.all([
    prisma.visit.count({ where: { clienteId } }),
    prisma.visit.findMany({
      where: { clienteId },
      include: { vehiculo: true, sucursal: true, membership: { include: { plan: true } } },
      orderBy: { fechaVisita: 'desc' },
      skip,
      take: pageSize,
    }),
  ])
  return { total, visitas, pages: Math.ceil(total / pageSize) }
}

export async function getClienteMembresias(clienteId: string) {
  return prisma.membership.findMany({
    where: { clienteId },
    include: { plan: true, metodoPago: true },
    orderBy: { createdAt: 'desc' },
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
