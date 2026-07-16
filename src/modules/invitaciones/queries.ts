import { cache } from 'react'
import { prisma } from '@/lib/prisma'

export async function getCampanaActiva(companyId: string) {
  return prisma.campanaInvitacion.findFirst({
    where: {
      companyId,
      estado: 'ACTIVA',
      fechaInicio: { lte: new Date() },
      fechaFin: { gte: new Date() },
    },
    orderBy: { orden: 'asc' },
  })
}

/**
 * Enlace corto personal /invitar/[code]: resuelve el código del cliente a la
 * campaña ACTIVA de su empresa (con la empresa incluida, para la landing y la
 * tarjeta OG). Devuelve también el ref normalizado para la atribución.
 * React.cache: generateMetadata y la página lo llaman en el mismo request —
 * una sola resolución (importa para el presupuesto de ~5 s del robot de
 * WhatsApp).
 */
export const getCampanaPorCodigoInvitacion = cache(async (code: string) => {
  const clean = decodeURIComponent(code).trim()
  if (!clean) return null

  const cliente = await prisma.cliente
    .findFirst({
      where: {
        OR: [{ codigoCorto: clean.toUpperCase() }, { codigoReferido: clean }],
      },
      select: { companyId: true, codigoCorto: true, codigoReferido: true },
    })
    .catch(() => null)
  if (!cliente) return null

  const campana = await prisma.campanaInvitacion
    .findFirst({
      where: {
        companyId: cliente.companyId,
        estado: 'ACTIVA',
        fechaInicio: { lte: new Date() },
        fechaFin: { gte: new Date() },
      },
      orderBy: { orden: 'asc' },
      include: {
        company: {
          select: { id: true, name: true, slug: true, logoUrl: true, colorPrimario: true, type: true },
        },
      },
    })
    .catch(() => null)
  if (!campana) return null

  return { campana, ref: cliente.codigoCorto ?? cliente.codigoReferido }
})

// React.cache por el mismo motivo que getCampanaPorCodigoInvitacion.
export const getCampanaBySlug = cache(async (slug: string) => {
  return prisma.campanaInvitacion.findUnique({
    where: { slug },
    include: {
      company: {
        select: { id: true, name: true, slug: true, logoUrl: true, colorPrimario: true, type: true },
      },
    },
  })
})

export async function getProgresoCliente(campanaId: string, clienteId: string) {
  return prisma.invitacionProgreso.findUnique({
    where: { campanaId_clienteId: { campanaId, clienteId } },
  })
}

export async function getProgresoOCrear(campanaId: string, clienteId: string, companyId: string) {
  return prisma.invitacionProgreso.upsert({
    where: { campanaId_clienteId: { campanaId, clienteId } },
    update: {},
    create: { campanaId, clienteId, companyId },
  })
}

export async function getCampanasEmpresa(companyId: string) {
  return prisma.campanaInvitacion.findMany({
    where: { companyId },
    orderBy: [{ estado: 'asc' }, { orden: 'asc' }, { createdAt: 'desc' }],
    include: {
      _count: {
        select: {
          progresos: true,
          eventos: true,
          referidos: true,
        },
      },
    },
  })
}

export interface CampanaDashboard {
  campana: Awaited<ReturnType<typeof getCampanaBySlug>>
  embudoStats: {
    compartidas: number
    enlacesAbiertos: number
    landingVistas: number
    registrosIniciados: number
    registrosCompletados: number
    premiosReclamados: number
    membresiasAdquiridas: number
    primerCanje: number
    conversionFinal: number
  }
  participantes: number
  metasAlcanzadas: number
  premiosReclamados: number
  topCompartidores: { nombre: string; compartidas: number; registros: number }[]
}

export async function getCampanaDashboard(campanaId: string): Promise<CampanaDashboard | null> {
  const campana = await prisma.campanaInvitacion.findUnique({
    where: { id: campanaId },
    include: {
      company: {
        select: { id: true, name: true, slug: true, logoUrl: true, colorPrimario: true, type: true },
      },
    },
  })
  if (!campana) return null

  const [eventosTipo, progresoAgg, topRaw] = await Promise.all([
    prisma.invitacionEvento.groupBy({
      by: ['tipo'],
      where: { campanaId },
      _count: { id: true },
    }),
    prisma.invitacionProgreso.aggregate({
      where: { campanaId },
      _count: { _all: true },
      _sum: { registrosCompletados: true },
    }),
    prisma.invitacionEvento.groupBy({
      by: ['clienteId'],
      where: { campanaId, tipo: 'COMPARTIDA', clienteId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  const countTipo = (t: string) =>
    eventosTipo.find((e) => e.tipo === t)?._count.id ?? 0

  const topIds = topRaw
    .map((t) => t.clienteId)
    .filter((id): id is string => id !== null)

  const [nombres, metasCount, premiosCount, registrosPorCliente] = await Promise.all([
    prisma.cliente.findMany({
      where: { id: { in: topIds } },
      select: { id: true, nombre: true },
    }),
    prisma.invitacionProgreso.count({ where: { campanaId, metaAlcanzada: true } }),
    prisma.invitacionProgreso.count({ where: { campanaId, premioReclamado: true } }),
    prisma.invitacionProgreso.findMany({
      where: { campanaId, clienteId: { in: topIds } },
      select: { clienteId: true, registrosCompletados: true },
    }),
  ])

  const nombreDe = new Map(nombres.map((n) => [n.id, n.nombre]))
  const regDe = new Map(registrosPorCliente.map((r) => [r.clienteId, r.registrosCompletados]))

  return {
    campana,
    embudoStats: {
      compartidas: countTipo('COMPARTIDA'),
      enlacesAbiertos: countTipo('ENLACE_ABIERTO'),
      landingVistas: countTipo('LANDING_VISTA'),
      registrosIniciados: countTipo('REGISTRO_INICIADO'),
      registrosCompletados: countTipo('REGISTRO_COMPLETADO'),
      premiosReclamados: countTipo('PREMIO_RECLAMADO'),
      membresiasAdquiridas: countTipo('MEMBRESIA_ADQUIRIDA'),
      primerCanje: countTipo('PRIMER_CANJE'),
      conversionFinal: countTipo('CONVERSION_FINAL'),
    },
    participantes: progresoAgg._count._all,
    metasAlcanzadas: metasCount,
    premiosReclamados: premiosCount,
    topCompartidores: topRaw.map((t) => ({
      nombre: nombreDe.get(t.clienteId!) ?? 'Cliente',
      compartidas: t._count.id,
      registros: regDe.get(t.clienteId!) ?? 0,
    })),
  }
}

/**
 * MVP "Invita y Gana" · Personas que se registraron gracias a un cliente.
 * Fuente: modelo Referido (auditoría de atribución). Excluye los marcados
 * sospechosos por el anti-fraude para no inflar la lista.
 */
export async function getInvitadosPorCliente(clienteId: string, limit = 50) {
  return prisma.referido.findMany({
    where: { referenteClienteId: clienteId, sospechoso: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      estado: true,
      recompensaAplicada: true,
      createdAt: true,
      referidoCliente: { select: { nombre: true } },
    },
  })
}

export interface InvitaYGanaStats {
  invitacionesEnviadas: number
  personasRegistradas: number
  recompensasObtenidas: number
  beneficiosActivos: number
}

/**
 * Unificación Referidos → Invita y Gana · "Mi progreso" del cliente.
 * Reutiliza las fuentes existentes (sin estadísticas duplicadas): eventos
 * COMPARTIDA, atribuciones Referido, recompensas del programa
 * (ReferralRecompensa + premios de campaña) y beneficios activos en wallet.
 */
export async function getInvitaYGanaStats(
  clienteId: string,
  companyId: string
): Promise<InvitaYGanaStats> {
  const [compartidas, registrados, recompensas, premiosCampana, activos] =
    await Promise.all([
      prisma.invitacionEvento.count({
        where: { clienteId, companyId, tipo: 'COMPARTIDA' },
      }),
      prisma.referido.count({
        where: { referenteClienteId: clienteId, sospechoso: false },
      }),
      prisma.referralRecompensa.count({
        where: { referenteClienteId: clienteId, companyId },
      }),
      prisma.invitacionProgreso.count({
        where: { clienteId, companyId, premioReclamado: true },
      }),
      prisma.productoCompra.count({
        where: { clienteId, companyId, estado: 'ACTIVA' },
      }),
    ])

  return {
    invitacionesEnviadas: compartidas,
    personasRegistradas: registrados,
    recompensasObtenidas: recompensas + premiosCampana,
    beneficiosActivos: activos,
  }
}
