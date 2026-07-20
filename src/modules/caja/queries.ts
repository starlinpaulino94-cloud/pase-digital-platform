import { prisma } from '@/lib/prisma'

/**
 * Caja (POS) · consultas del turno y búsqueda de órdenes pendientes.
 * Multi-tenant: TODO se filtra por companyId del staff autenticado.
 */

/** Sesión ABIERTA de una sucursal (una como máximo por diseño). */
export async function getCajaAbierta(sucursalId: string) {
  return prisma.cajaSesion.findFirst({
    where: { sucursalId, estado: 'ABIERTA' },
    include: {
      sucursal: { select: { id: true, nombre: true } },
      abiertaPor: { select: { id: true, name: true } },
    },
    orderBy: { abiertaAt: 'desc' },
  })
}

export async function getSucursalesActivas(companyId: string) {
  return prisma.sucursal.findMany({
    where: { companyId, activa: true },
    select: { id: true, nombre: true, direccion: true },
    orderBy: { nombre: 'asc' },
  })
}

export interface ResumenSesion {
  cobros: number
  totalEfectivo: number
  totalTransferencia: number
  totalOtro: number
  total: number
  ultimos: {
    id: string
    codigo: string
    clienteNombre: string
    detalle: string
    monto: number
    metodoCobro: string | null
    createdAt: Date
    /** true = ya tiene impresión original (la siguiente sale como COPIA). */
    impresa: boolean
  }[]
}

/** Ventas del turno: totales por método + últimos cobros de la sesión. */
export async function getResumenSesion(cajaSesionId: string): Promise<ResumenSesion> {
  const cobros = await prisma.transaction.findMany({
    where: { cajaSesionId, estado: 'APPLIED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      codigo: true,
      monto: true,
      metodoCobro: true,
      snapshot: true,
      createdAt: true,
      cliente: { select: { nombre: true } },
      _count: { select: { impresiones: true } },
    },
  })

  const sum = (metodo: string) =>
    cobros
      .filter((c) => c.metodoCobro === metodo)
      .reduce((acc, c) => acc + Number(c.monto ?? 0), 0)

  return {
    cobros: cobros.length,
    totalEfectivo: sum('EFECTIVO'),
    totalTransferencia: sum('TRANSFERENCIA'),
    totalOtro: sum('OTRO'),
    total: cobros.reduce((acc, c) => acc + Number(c.monto ?? 0), 0),
    ultimos: cobros.slice(0, 15).map((c) => {
      const snap = (c.snapshot ?? {}) as { detalle?: string }
      return {
        id: c.id,
        codigo: c.codigo,
        clienteNombre: c.cliente?.nombre ?? 'Cliente',
        detalle: snap.detalle ?? '',
        monto: Number(c.monto ?? 0),
        metodoCobro: c.metodoCobro,
        createdAt: c.createdAt,
        impresa: c._count.impresiones > 0,
      }
    }),
  }
}

// ── Cierre de caja (Z-report) ────────────────────────────────────────────────

/** Etiquetas legibles de los tipos de transacción en el cierre. */
const TIPO_LABEL: Record<string, string> = {
  SALE: 'Ventas',
  MEMBERSHIP_REDEMPTION: 'Uso de membresía',
  PROMOTION_USE: 'Uso de promoción',
  BENEFIT_USE: 'Entrega de beneficio',
  REWARD_REDEMPTION: 'Canje de premio',
  COUPON_USE: 'Cupón',
  POINTS_SPEND: 'Puntos',
  REFERRAL: 'Referido',
  PURCHASE: 'Compra',
  OTHER: 'Otro',
}

export interface CierreReporte {
  id: string
  sucursal: string
  turno: string | null
  estado: string
  abiertaPor: string
  cerradaPor: string | null
  abiertaAt: Date
  cerradaAt: Date | null
  balanceInicial: number
  balanceFinal: number | null
  balanceEsperado: number | null
  diferencia: number | null
  observaciones: string | null
  cobros: number
  total: number
  porMetodo: { efectivo: number; transferencia: number; otro: number }
  porTipo: { tipo: string; label: string; cantidad: number; total: number }[]
  porEmpleado: { empleado: string; cantidad: number; total: number }[]
  empresa: {
    nombre: string
    logoUrl: string | null
    direccion: string | null
    telefono: string | null
  }
  timeZone: string
}

/**
 * Reporte de cierre de una sesión de caja (arqueo "Z"): datos del turno +
 * cobros desglosados por método, por tipo de operación y por empleado. Sirve
 * para imprimir y reimprimir. Filtra por companyId (multi-tenant).
 */
export async function getCierreReporte(
  cajaSesionId: string,
  companyId: string
): Promise<CierreReporte | null> {
  const sesion = await prisma.cajaSesion.findFirst({
    where: { id: cajaSesionId, companyId },
    include: {
      sucursal: { select: { nombre: true } },
      abiertaPor: { select: { name: true } },
      cerradaPor: { select: { name: true } },
      company: {
        select: {
          name: true,
          logoUrl: true,
          direccion: true,
          telefono: true,
          zonaHoraria: true,
        },
      },
    },
  })
  if (!sesion) return null

  const cobros = await prisma.transaction.findMany({
    where: { cajaSesionId, estado: 'APPLIED' },
    select: {
      monto: true,
      metodoCobro: true,
      tipo: true,
      empleado: { select: { name: true } },
    },
  })

  const porMetodo = { efectivo: 0, transferencia: 0, otro: 0 }
  const tipoMap = new Map<string, { cantidad: number; total: number }>()
  const empMap = new Map<string, { cantidad: number; total: number }>()
  let total = 0

  for (const c of cobros) {
    const monto = Number(c.monto ?? 0)
    total += monto
    if (c.metodoCobro === 'EFECTIVO') porMetodo.efectivo += monto
    else if (c.metodoCobro === 'TRANSFERENCIA') porMetodo.transferencia += monto
    else porMetodo.otro += monto

    const t = tipoMap.get(c.tipo) ?? { cantidad: 0, total: 0 }
    t.cantidad += 1
    t.total += monto
    tipoMap.set(c.tipo, t)

    const nombre = c.empleado?.name ?? 'Sin asignar'
    const e = empMap.get(nombre) ?? { cantidad: 0, total: 0 }
    e.cantidad += 1
    e.total += monto
    empMap.set(nombre, e)
  }

  return {
    id: sesion.id,
    sucursal: sesion.sucursal.nombre,
    turno: sesion.turno,
    estado: sesion.estado,
    abiertaPor: sesion.abiertaPor.name ?? '—',
    cerradaPor: sesion.cerradaPor?.name ?? null,
    abiertaAt: sesion.abiertaAt,
    cerradaAt: sesion.cerradaAt,
    balanceInicial: Number(sesion.balanceInicial),
    balanceFinal: sesion.balanceFinal == null ? null : Number(sesion.balanceFinal),
    balanceEsperado: sesion.balanceEsperado == null ? null : Number(sesion.balanceEsperado),
    diferencia: sesion.diferencia == null ? null : Number(sesion.diferencia),
    observaciones: sesion.observaciones,
    cobros: cobros.length,
    total,
    porMetodo,
    porTipo: [...tipoMap.entries()]
      .map(([tipo, v]) => ({ tipo, label: TIPO_LABEL[tipo] ?? tipo, ...v }))
      .sort((a, b) => b.total - a.total),
    porEmpleado: [...empMap.entries()]
      .map(([empleado, v]) => ({ empleado, ...v }))
      .sort((a, b) => b.total - a.total),
    empresa: {
      nombre: sesion.company.name,
      logoUrl: sesion.company.logoUrl,
      direccion: sesion.company.direccion,
      telefono: sesion.company.telefono,
    },
    timeZone: sesion.company.zonaHoraria,
  }
}

export interface CierreListItem {
  id: string
  sucursal: string
  turno: string | null
  cerradaAt: Date | null
  cerradaPor: string | null
  balanceFinal: number | null
  diferencia: number | null
}

/** Últimos cierres de caja de la empresa, para imprimir/reimprimir. */
export async function getCierresRecientes(
  companyId: string,
  limit = 8
): Promise<CierreListItem[]> {
  const sesiones = await prisma.cajaSesion.findMany({
    where: { companyId, estado: 'CERRADA' },
    orderBy: { cerradaAt: 'desc' },
    take: limit,
    include: {
      sucursal: { select: { nombre: true } },
      cerradaPor: { select: { name: true } },
    },
  })
  return sesiones.map((s) => ({
    id: s.id,
    sucursal: s.sucursal.nombre,
    turno: s.turno,
    cerradaAt: s.cerradaAt,
    cerradaPor: s.cerradaPor?.name ?? null,
    balanceFinal: s.balanceFinal == null ? null : Number(s.balanceFinal),
    diferencia: s.diferencia == null ? null : Number(s.diferencia),
  }))
}

export interface OrdenPendiente {
  /** MEMBRESIA = pago de plan (o cambio de plan); PROMOCION = compra. */
  tipo: 'MEMBRESIA' | 'PROMOCION'
  id: string
  referencia: string | null
  estado: string
  clienteNombre: string
  clienteTelefono: string | null
  clienteEmail: string | null
  detalle: string
  monto: number
  sucursalPago: string | null
  createdAt: Date
}

/** Estados de membresía con pago pendiente de cobrar en caja. */
const MEMBRESIA_COBRABLE = ['PENDIENTE', 'PENDIENTE_PAGO', 'RECHAZADA'] as const
/** Estados de compra de promoción con pago pendiente. */
const COMPRA_COBRABLE = ['SOLICITADA', 'PENDIENTE_PAGO', 'EN_VALIDACION', 'RECHAZADA'] as const

/**
 * Búsqueda de órdenes pendientes por referencia, nombre, teléfono o correo.
 * Sin término, devuelve las más recientes (cola de pendientes).
 */
export async function buscarOrdenesPendientes(
  companyId: string,
  q: string,
  limit = 20
): Promise<OrdenPendiente[]> {
  const term = q.trim()
  const filtroCliente = term
    ? {
        OR: [
          { nombre: { contains: term, mode: 'insensitive' as const } },
          { telefono: { contains: term } },
          { email: { contains: term, mode: 'insensitive' as const } },
        ],
      }
    : {}
  const filtroReferencia = term ? { referencia: { equals: term.toUpperCase() } } : null

  const [memberships, compras] = await Promise.all([
    prisma.membership.findMany({
      where: {
        cliente: { companyId, ...(filtroReferencia ? {} : filtroCliente) },
        ...(filtroReferencia
          ? { OR: [filtroReferencia, { cliente: { companyId, ...filtroCliente } }] }
          : {}),
        OR: [
          { estado: { in: [...MEMBRESIA_COBRABLE] } },
          // Cambio de plan pendiente de pago (membresía sigue ACTIVA).
          { estado: 'ACTIVA', planIdSolicitado: { not: null } },
        ],
      },
      include: {
        cliente: { select: { nombre: true, telefono: true, email: true } },
        plan: { select: { nombre: true, precio: true } },
        planSolicitado: { select: { nombre: true, precio: true } },
        sucursalPago: { select: { nombre: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    }),
    prisma.productoCompra.findMany({
      where: {
        companyId,
        estado: { in: [...COMPRA_COBRABLE] },
        ...(filtroReferencia
          ? { OR: [filtroReferencia, { cliente: filtroCliente }] }
          : { cliente: filtroCliente }),
      },
      include: {
        cliente: { select: { nombre: true, telefono: true, email: true } },
        promocion: { select: { titulo: true, precio: true } },
        sucursalPago: { select: { nombre: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    }),
  ])

  const ordenes: OrdenPendiente[] = [
    ...memberships.map((m): OrdenPendiente => {
      const esCambio = m.estado === 'ACTIVA' && m.planIdSolicitado != null
      const plan = esCambio ? m.planSolicitado : m.plan
      const descuento = m.fechaInicio == null ? Number(m.descuentoBienvenida ?? 0) : 0
      return {
        tipo: 'MEMBRESIA',
        id: m.id,
        referencia: m.referencia,
        estado: esCambio ? 'CAMBIO_PLAN' : m.estado,
        clienteNombre: m.cliente.nombre,
        clienteTelefono: m.cliente.telefono,
        clienteEmail: m.cliente.email,
        detalle: `${esCambio ? 'Cambio a ' : 'Plan '}${plan?.nombre ?? '—'}`,
        monto: Math.max(0, Number(plan?.precio ?? 0) - descuento),
        sucursalPago: m.sucursalPago?.nombre ?? null,
        createdAt: m.createdAt,
      }
    }),
    ...compras.map(
      (c): OrdenPendiente => ({
        tipo: 'PROMOCION',
        id: c.id,
        referencia: c.referencia,
        estado: c.estado,
        clienteNombre: c.cliente.nombre,
        clienteTelefono: c.cliente.telefono,
        clienteEmail: c.cliente.email,
        detalle: `Promoción ${c.promocion?.titulo ?? '—'}`,
        monto: Number(c.precioCongelado ?? c.promocion?.precio ?? 0),
        sucursalPago: c.sucursalPago?.nombre ?? null,
        createdAt: c.createdAt,
      })
    ),
  ]

  return ordenes
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
}
