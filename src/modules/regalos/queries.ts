import { prisma } from '@/lib/prisma'

/**
 * Regalos P2P · Fase R2 — consultas del módulo /cliente/regalos.
 *
 * Expiración PEREZOSA: no hay cron. Cada vez que se listan o se responden
 * regalos, los PENDIENTES vencidos se marcan EXPIRADO y se devuelven los usos
 * al remitente. Así el sistema es correcto sin infraestructura extra.
 */

export interface RegaloItem {
  id: string
  tipo: string
  estado: string
  usos: number
  mensaje: string | null
  beneficio: string
  /** Nombre enmascarado de la otra parte. */
  contraparte: string
  expiraAt: Date
  createdAt: Date
  resueltoAt: Date | null
}

function enmascarar(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  if (partes.length === 1) return partes[0]
  return `${partes[0]} ${partes[1][0]?.toUpperCase() ?? ''}.`
}

/** Devuelve usos reservados al remitente de un regalo que no prosperó. */
export async function devolverUsos(regalo: {
  compraOrigenId: string | null
  membershipOrigenId: string | null
  usos: number
}) {
  if (regalo.compraOrigenId) {
    await prisma.productoCompra.update({
      where: { id: regalo.compraOrigenId },
      data: { usosRestantes: { increment: regalo.usos }, consumidaAt: null, estado: 'ACTIVA' },
    })
  } else if (regalo.membershipOrigenId) {
    await prisma.membership.update({
      where: { id: regalo.membershipOrigenId },
      data: { lavadosRestantes: { increment: regalo.usos } },
    })
  }
}

/** Marca EXPIRADO todo pendiente vencido del cliente (como remitente o receptor) y devuelve usos. */
export async function expirarPendientesVencidos(clienteId: string) {
  const vencidos = await prisma.regalo.findMany({
    where: {
      estado: 'PENDIENTE',
      expiraAt: { lt: new Date() },
      OR: [{ remitenteId: clienteId }, { destinatarioId: clienteId }],
    },
    select: { id: true, compraOrigenId: true, membershipOrigenId: true, usos: true },
  })
  for (const r of vencidos) {
    // Guard atómico: solo el primero en marcarlo devuelve los usos.
    const upd = await prisma.regalo.updateMany({
      where: { id: r.id, estado: 'PENDIENTE' },
      data: { estado: 'EXPIRADO', resueltoAt: new Date() },
    })
    if (upd.count > 0) await devolverUsos(r).catch((e) => console.error('[regalos] refund exp', e))
  }
}

/** Nombre legible del contenido de un regalo (promo o lavados del plan). */
async function etiquetaBeneficio(r: {
  compraOrigenId: string | null
  membershipOrigenId: string | null
  promocionId: string | null
  usos: number
}): Promise<string> {
  if (r.promocionId) {
    const p = await prisma.promocion.findUnique({
      where: { id: r.promocionId },
      select: { titulo: true },
    })
    if (p) return p.titulo
  }
  if (r.membershipOrigenId) return `${r.usos} lavado${r.usos !== 1 ? 's' : ''} del plan`
  return 'Beneficio'
}

export async function getRegalosCliente(clienteId: string): Promise<{
  recibidos: RegaloItem[]
  enviados: RegaloItem[]
  pendientesRecibidos: number
}> {
  await expirarPendientesVencidos(clienteId).catch(() => {})

  const regalos = await prisma.regalo.findMany({
    where: { OR: [{ remitenteId: clienteId }, { destinatarioId: clienteId }] },
    include: {
      remitente: { select: { nombre: true } },
      destinatario: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  })

  const items = await Promise.all(
    regalos.map(async (r) => ({
      raw: r,
      item: {
        id: r.id,
        tipo: r.tipo,
        estado: r.estado,
        usos: r.usos,
        mensaje: r.mensaje,
        beneficio: await etiquetaBeneficio(r),
        contraparte:
          r.remitenteId === clienteId
            ? r.destinatario
              ? enmascarar(r.destinatario.nombre)
              : (r.destinatarioContacto ?? '—')
            : enmascarar(r.remitente.nombre),
        expiraAt: r.expiraAt,
        createdAt: r.createdAt,
        resueltoAt: r.resueltoAt,
      } satisfies RegaloItem,
    }))
  )

  const recibidos = items.filter((x) => x.raw.destinatarioId === clienteId).map((x) => x.item)
  const enviados = items.filter((x) => x.raw.remitenteId === clienteId).map((x) => x.item)
  return {
    recibidos,
    enviados,
    pendientesRecibidos: recibidos.filter((i) => i.estado === 'PENDIENTE').length,
  }
}

export interface FuenteTransferencia {
  /** 'COMPRA' (wallet) o 'MEMBRESIA' (lavados del plan). */
  origen: 'COMPRA' | 'MEMBRESIA'
  id: string
  titulo: string
  disponibles: number
}

/**
 * De dónde puede transferir el cliente: compras ACTIVAS pagadas con usos
 * (anti-farmeo: los beneficios gratis de campaña/ruleta/bienvenida nacen con
 * precio 0 y NO son transferibles) + su membresía activa con lavados.
 */
export async function getFuentesTransferencia(
  clienteId: string
): Promise<FuenteTransferencia[]> {
  const [compras, membresia] = await Promise.all([
    prisma.productoCompra.findMany({
      where: {
        clienteId,
        estado: 'ACTIVA',
        usosRestantes: { gt: 0 },
        promocionId: { not: null },
        precioCongelado: { gt: 0 },
      },
      select: {
        id: true,
        usosRestantes: true,
        promocion: { select: { titulo: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.membership.findFirst({
      where: {
        cliente: { id: clienteId },
        estado: 'ACTIVA',
        lavadosRestantes: { gt: 0 },
        OR: [{ fechaVencimiento: null }, { fechaVencimiento: { gt: new Date() } }],
      },
      select: { id: true, lavadosRestantes: true, plan: { select: { nombre: true } } },
    }),
  ])

  const fuentes: FuenteTransferencia[] = compras.map((c) => ({
    origen: 'COMPRA' as const,
    id: c.id,
    titulo: c.promocion?.titulo ?? 'Promoción',
    disponibles: c.usosRestantes,
  }))
  if (membresia) {
    fuentes.push({
      origen: 'MEMBRESIA',
      id: membresia.id,
      titulo: `Lavados de mi ${membresia.plan.nombre}`,
      disponibles: membresia.lavadosRestantes,
    })
  }
  return fuentes
}
