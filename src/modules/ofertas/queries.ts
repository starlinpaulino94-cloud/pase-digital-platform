import { prisma } from '@/lib/prisma'
import { inicioPeriodo } from '@/modules/ofertas/periodo'

/**
 * Ofertas VIP · consultas. Multi-tenant: todo filtrado por companyId.
 */

/** ¿La oferta sigue canjeable? (estado + vigencia). */
export function ofertaVigente(o: { estado: string; vigenciaHasta: Date | null }): boolean {
  if (o.estado !== 'ACTIVA') return false
  if (o.vigenciaHasta && o.vigenciaHasta.getTime() < Date.now()) return false
  return true
}

/** Listado del panel con conteos. */
export async function getOfertasAdmin(companyId: string) {
  return prisma.ofertaPrivada.findMany({
    where: { companyId },
    include: {
      _count: { select: { invitados: true } },
      invitados: { where: { reclamadaAt: { not: null } }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

/** Detalle del panel: invitados con usos del período actual y totales. */
export async function getOfertaDetalleAdmin(companyId: string, ofertaId: string, timeZone: string) {
  const oferta = await prisma.ofertaPrivada.findFirst({
    where: { id: ofertaId, companyId },
    include: {
      invitados: {
        include: {
          cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
          _count: { select: { usos: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!oferta) return null

  const desde = inicioPeriodo(oferta.periodo, timeZone)
  const usosPeriodo = await prisma.ofertaUso.groupBy({
    by: ['invitadoId'],
    where: {
      invitado: { ofertaId: oferta.id },
      createdAt: { gte: desde },
    },
    _count: { _all: true },
  })
  const porInvitado = new Map(usosPeriodo.map((u) => [u.invitadoId, u._count._all]))

  return {
    oferta,
    invitados: oferta.invitados.map((i) => ({
      id: i.id,
      cliente: i.cliente,
      reclamadaAt: i.reclamadaAt,
      usosTotales: i._count.usos,
      usosPeriodo: porInvitado.get(i.id) ?? 0,
    })),
  }
}

export type EstadoOfertaCliente =
  | 'NO_INVITADO'
  | 'INVITADO' // en la lista, sin reclamar
  | 'RECLAMADA'
  | 'NO_DISPONIBLE' // pausada/finalizada/vencida

/** Resolución del link /oferta/[codigo] para un cliente concreto. */
export async function getOfertaParaCliente(codigo: string, clienteId: string | null) {
  const oferta = await prisma.ofertaPrivada.findUnique({
    where: { codigo },
    include: { company: { select: { name: true, zonaHoraria: true, logoUrl: true } } },
  })
  if (!oferta) return null

  const invitado = clienteId
    ? await prisma.ofertaInvitado.findUnique({
        where: { ofertaId_clienteId: { ofertaId: oferta.id, clienteId } },
      })
    : null

  let estadoCliente: EstadoOfertaCliente
  if (!invitado) estadoCliente = 'NO_INVITADO'
  else if (!ofertaVigente(oferta)) estadoCliente = 'NO_DISPONIBLE'
  else estadoCliente = invitado.reclamadaAt ? 'RECLAMADA' : 'INVITADO'

  let usosPeriodo = 0
  if (invitado) {
    usosPeriodo = await prisma.ofertaUso.count({
      where: {
        invitadoId: invitado.id,
        createdAt: { gte: inicioPeriodo(oferta.periodo, oferta.company.zonaHoraria) },
      },
    })
  }

  return { oferta, invitado, estadoCliente, usosPeriodo }
}

/** Regalos reclamados del cliente (para Mis beneficios). */
export async function getRegalosCliente(clienteId: string) {
  const invitaciones = await prisma.ofertaInvitado.findMany({
    where: { clienteId, reclamadaAt: { not: null }, oferta: { estado: 'ACTIVA' } },
    include: {
      oferta: { include: { company: { select: { name: true, zonaHoraria: true } } } },
    },
    orderBy: { reclamadaAt: 'desc' },
  })
  const activos = invitaciones.filter((i) => ofertaVigente(i.oferta))

  return Promise.all(
    activos.map(async (i) => ({
      invitadoId: i.id,
      codigo: i.oferta.codigo,
      titulo: i.oferta.titulo,
      usosPorPeriodo: i.oferta.usosPorPeriodo,
      periodo: i.oferta.periodo,
      vigenciaHasta: i.oferta.vigenciaHasta,
      usosPeriodo: await prisma.ofertaUso.count({
        where: {
          invitadoId: i.id,
          createdAt: {
            gte: inicioPeriodo(i.oferta.periodo, i.oferta.company.zonaHoraria),
          },
        },
      }),
    }))
  )
}
