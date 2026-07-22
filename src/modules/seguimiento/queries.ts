import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

/**
 * Seguimiento de beneficios gratis (docs/SEGUIMIENTO-BENEFICIOS.md · Fase S1).
 *
 * Inventario de las recompensas GRATUITAS con QR que la empresa entregó
 * (lavado gratis, premios de ruleta, referidos, campañas): quién las tiene,
 * quién NO ha usado su QR, quién sí lo usó y quién se lo canjeó.
 *
 * "Gratis" = ProductoCompra tipo PROMOCION, con promoción, precioCongelado en
 * 0/null. El estado de seguimiento se DERIVA de la compra (sin columnas
 * nuevas).
 */

export type SeguimientoEstado = 'SIN_USAR' | 'USADO' | 'VENCIDO'

export const SEGUIMIENTO_ESTADO_LABEL: Record<SeguimientoEstado, string> = {
  SIN_USAR: 'Sin usar',
  USADO: 'Usado',
  VENCIDO: 'Vencido',
}

export interface SeguimientoItem {
  compraId: string
  clienteId: string
  cliente: string
  telefono: string | null
  email: string | null
  promocion: string
  promocionId: string | null
  estado: SeguimientoEstado
  usosIncluidos: number
  usosRestantes: number
  /** Token del QR activo (para canje interno / mostrar). null si ya se usó. */
  qrTokenId: string | null
  otorgadoAt: Date
  venceAt: Date | null
  usadoAt: Date | null
  /** Nombre del empleado/admin que canjeó (si ya se usó). */
  usadoPor: string | null
  /** true = el canje lo hizo un admin internamente (sin el cliente presente). */
  canjeInterno: boolean
  /** Días desde que se otorgó (para priorizar recordatorios). */
  diasDesdeOtorgado: number
}

export interface SeguimientoKpis {
  total: number
  sinUsar: number
  usados: number
  vencidos: number
  /** % de recompensas usadas sobre el total otorgado. */
  tasaUso: number | null
  /** Antigüedad promedio (días) de las que siguen sin usar. */
  antiguedadPromedioSinUsar: number | null
}

export interface SeguimientoFiltro {
  estado?: string
  promocionId?: string
  q?: string
  desde?: string
  hasta?: string
}

export interface OpcionPromoGratis {
  id: string
  titulo: string
}

/** Where base: recompensas GRATIS con QR de la empresa. */
function whereBase(companyId: string): Prisma.ProductoCompraWhereInput {
  return {
    companyId,
    tipo: 'PROMOCION',
    promocionId: { not: null },
    estado: { in: ['ACTIVA', 'CONSUMIDA', 'EXPIRADA'] },
    OR: [{ precioCongelado: null }, { precioCongelado: { lte: 0 } }],
  }
}

/** Promos gratis que han generado recompensas (para el filtro). */
export async function getPromosGratisConEntregas(
  companyId: string
): Promise<OpcionPromoGratis[]> {
  const grupos = await prisma.productoCompra.groupBy({
    by: ['promocionId'],
    where: whereBase(companyId),
    _count: { _all: true },
  })
  const ids = grupos.map((g) => g.promocionId).filter((x): x is string => !!x)
  if (ids.length === 0) return []
  const promos = await prisma.promocion.findMany({
    where: { id: { in: ids } },
    select: { id: true, titulo: true },
    orderBy: { titulo: 'asc' },
  })
  return promos
}

function estadoDe(c: {
  estado: string
  usosIncluidos: number
  usosRestantes: number
  fechaVencimiento: Date | null
  consumidaAt: Date | null
}): SeguimientoEstado {
  const ahora = Date.now()
  if (c.estado === 'CONSUMIDA' || c.usosRestantes < c.usosIncluidos) return 'USADO'
  if (c.estado === 'EXPIRADA') return 'VENCIDO'
  if (c.fechaVencimiento && c.fechaVencimiento.getTime() < ahora) return 'VENCIDO'
  return 'SIN_USAR'
}

/**
 * Inventario de seguimiento + KPIs. Los KPIs se calculan sobre TODO el
 * universo de la empresa; la lista se limita a los 200 más recientes según
 * el filtro.
 */
export async function getSeguimiento(
  companyId: string,
  filtro: SeguimientoFiltro = {}
): Promise<{ items: SeguimientoItem[]; kpis: SeguimientoKpis; truncado: boolean }> {
  const ahora = new Date()
  const base = whereBase(companyId)

  // ── KPIs sobre todo el universo (sin filtro) ───────────────────────────────
  const universo = await prisma.productoCompra.findMany({
    where: base,
    select: {
      estado: true,
      usosIncluidos: true,
      usosRestantes: true,
      fechaVencimiento: true,
      consumidaAt: true,
      createdAt: true,
    },
  })
  let sinUsar = 0
  let usados = 0
  let vencidos = 0
  let sumaDiasSinUsar = 0
  for (const c of universo) {
    const e = estadoDe(c)
    if (e === 'SIN_USAR') {
      sinUsar++
      sumaDiasSinUsar += Math.floor((ahora.getTime() - c.createdAt.getTime()) / 86_400_000)
    } else if (e === 'USADO') usados++
    else vencidos++
  }
  const total = universo.length
  const resueltos = usados + vencidos
  const kpis: SeguimientoKpis = {
    total,
    sinUsar,
    usados,
    vencidos,
    tasaUso: usados + vencidos > 0 ? Math.round((usados / resueltos) * 100) : null,
    antiguedadPromedioSinUsar: sinUsar > 0 ? Math.round(sumaDiasSinUsar / sinUsar) : null,
  }

  // ── Lista filtrada ─────────────────────────────────────────────────────────
  const where: Prisma.ProductoCompraWhereInput = { ...base }
  if (filtro.promocionId) where.promocionId = filtro.promocionId
  if (filtro.desde || filtro.hasta) {
    where.createdAt = {
      ...(filtro.desde ? { gte: new Date(`${filtro.desde}T00:00:00`) } : {}),
      ...(filtro.hasta ? { lte: new Date(`${filtro.hasta}T23:59:59`) } : {}),
    }
  }
  if (filtro.q?.trim()) {
    const q = filtro.q.trim()
    where.cliente = {
      OR: [
        { nombre: { contains: q, mode: 'insensitive' } },
        { telefono: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    }
  }

  const TAKE = 200
  const compras = await prisma.productoCompra.findMany({
    where,
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
      promocion: { select: { id: true, titulo: true } },
      qrTokens: { where: { activo: true }, select: { id: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
    take: TAKE + 1,
  })

  // Canje: quién y cuándo (transacción PROMOTION_USE cuyo QR pertenece a estas
  // compras). Una consulta para todas.
  const compraIds = compras.slice(0, TAKE).map((c) => c.id)
  const canjes = compraIds.length
    ? await prisma.transaction.findMany({
        where: {
          tipo: 'PROMOTION_USE',
          estado: 'APPLIED',
          qrTokenUsado: { compraId: { in: compraIds } },
        },
        select: {
          createdAt: true,
          snapshot: true,
          empleado: { select: { name: true } },
          qrTokenUsado: { select: { compraId: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []
  const canjePorCompra = new Map<string, { at: Date; por: string | null; interno: boolean }>()
  for (const t of canjes) {
    const cid = t.qrTokenUsado?.compraId
    if (!cid || canjePorCompra.has(cid)) continue // el más reciente gana
    const snap = (t.snapshot ?? {}) as { canjeInterno?: boolean }
    canjePorCompra.set(cid, {
      at: t.createdAt,
      por: t.empleado?.name ?? null,
      interno: snap.canjeInterno === true,
    })
  }

  let filtradosEstado = compras.slice(0, TAKE).map((c): SeguimientoItem => {
    const estado = estadoDe(c)
    const canje = canjePorCompra.get(c.id)
    return {
      compraId: c.id,
      clienteId: c.cliente.id,
      cliente: c.cliente.nombre,
      telefono: c.cliente.telefono,
      email: c.cliente.email,
      promocion: c.promocion?.titulo ?? 'Recompensa',
      promocionId: c.promocionId,
      estado,
      usosIncluidos: c.usosIncluidos,
      usosRestantes: c.usosRestantes,
      qrTokenId: c.qrTokens[0]?.id ?? null,
      otorgadoAt: c.createdAt,
      venceAt: c.fechaVencimiento,
      usadoAt: canje?.at ?? c.consumidaAt ?? null,
      usadoPor: canje?.por ?? null,
      canjeInterno: canje?.interno ?? false,
      diasDesdeOtorgado: Math.floor((ahora.getTime() - c.createdAt.getTime()) / 86_400_000),
    }
  })

  // El filtro por estado se aplica sobre el estado DERIVADO (no hay columna).
  if (filtro.estado && ['SIN_USAR', 'USADO', 'VENCIDO'].includes(filtro.estado)) {
    filtradosEstado = filtradosEstado.filter((i) => i.estado === filtro.estado)
  }

  return { items: filtradosEstado, kpis, truncado: compras.length > TAKE }
}
