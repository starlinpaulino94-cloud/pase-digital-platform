'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/guards'
import { SCANNER_ROLES } from '@/types'
import { getRequestMeta } from '@/lib/server-utils'
import { formSubmitLimiter } from '@/lib/rate-limit'
import { activarMembresia } from '@/modules/pagos/activacion'
import { activarCompraPromocion } from '@/modules/pagos/activacionCompra'
import { crearTransaccionAplicada } from '@/lib/transactions/application/transaction-service'
import { crearNotificacion } from '@/modules/notificaciones/service'

/**
 * Caja (POS) · acciones del turno: abrir, cerrar (con arqueo) y cobrar.
 *
 * Reglas de seguridad:
 *  - Solo staff con acceso al escáner (SCANNER_ROLES) y de la MISMA empresa.
 *  - No se cobra con la caja cerrada.
 *  - Anti doble-cobro: la activación es atómica y rechaza estados ya activos.
 *  - Nada se elimina: sesiones, transacciones y auditoría son permanentes.
 */

export interface CajaActionState {
  error?: string
  success?: boolean
  /** Mensaje de éxito para la UI (ej. código de la transacción). */
  detalle?: string
}

async function staffAutorizado() {
  const user = await requireRole(SCANNER_ROLES)
  const companyId = user.metadata.companyId
  if (!companyId) return null
  return { user, companyId, userId: user.metadata.dbUserId ?? null }
}

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export async function abrirCaja(
  _prev: CajaActionState,
  formData: FormData
): Promise<CajaActionState> {
  const auth = await staffAutorizado()
  if (!auth) return { error: 'No autorizado.' }
  if (!formSubmitLimiter(`caja:${auth.userId}`)) {
    return { error: 'Demasiados intentos. Espera un momento.' }
  }

  const sucursalId = String(formData.get('sucursalId') ?? '').trim()
  const balanceInicial = num(formData.get('balanceInicial')) ?? 0
  const turno = String(formData.get('turno') ?? '').trim() || null
  if (!sucursalId) return { error: 'Selecciona la sucursal.' }
  if (balanceInicial < 0) return { error: 'El balance inicial no puede ser negativo.' }

  const sucursal = await prisma.sucursal.findFirst({
    where: { id: sucursalId, companyId: auth.companyId, activa: true },
    select: { id: true, nombre: true },
  })
  if (!sucursal) return { error: 'Sucursal no válida.' }

  const yaAbierta = await prisma.cajaSesion.findFirst({
    where: { sucursalId, estado: 'ABIERTA' },
    select: { id: true },
  })
  if (yaAbierta) return { error: 'Esta sucursal ya tiene una caja abierta. Ciérrala antes de abrir otra.' }

  const meta = await getRequestMeta()
  const sesion = await prisma.cajaSesion.create({
    data: {
      companyId: auth.companyId,
      sucursalId,
      abiertaPorId: auth.userId!,
      turno,
      balanceInicial,
    },
    select: { id: true },
  })

  await prisma.auditLog.create({
    data: {
      companyId: auth.companyId,
      userId: auth.userId,
      accion: 'CAJA_ABIERTA',
      entidadTipo: 'CajaSesion',
      entidadId: sesion.id,
      payload: { sucursal: sucursal.nombre, balanceInicial, turno },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  })

  revalidatePath('/empleado/caja')
  return { success: true, detalle: `Caja abierta en ${sucursal.nombre}.` }
}

export async function cerrarCaja(
  _prev: CajaActionState,
  formData: FormData
): Promise<CajaActionState> {
  const auth = await staffAutorizado()
  if (!auth) return { error: 'No autorizado.' }

  const cajaSesionId = String(formData.get('cajaSesionId') ?? '').trim()
  const balanceFinal = num(formData.get('balanceFinal'))
  const observaciones = String(formData.get('observaciones') ?? '').trim() || null
  if (!cajaSesionId) return { error: 'Sesión no especificada.' }
  if (balanceFinal == null || balanceFinal < 0) {
    return { error: 'Indica el efectivo contado al cerrar.' }
  }

  const sesion = await prisma.cajaSesion.findFirst({
    where: { id: cajaSesionId, companyId: auth.companyId, estado: 'ABIERTA' },
    select: { id: true, balanceInicial: true, sucursal: { select: { nombre: true } } },
  })
  if (!sesion) return { error: 'La caja ya está cerrada o no existe.' }

  // Arqueo: esperado = inicial + cobros en efectivo de la sesión.
  const efectivo = await prisma.transaction.aggregate({
    where: { cajaSesionId, estado: 'APPLIED', metodoCobro: 'EFECTIVO' },
    _sum: { monto: true },
  })
  const balanceEsperado = Number(sesion.balanceInicial) + Number(efectivo._sum.monto ?? 0)
  const diferencia = balanceFinal - balanceEsperado

  const meta = await getRequestMeta()
  // Guard atómico: solo cierra si sigue ABIERTA (dos cierres concurrentes → uno gana).
  const cerrada = await prisma.cajaSesion.updateMany({
    where: { id: cajaSesionId, estado: 'ABIERTA' },
    data: {
      estado: 'CERRADA',
      cerradaPorId: auth.userId,
      cerradaAt: new Date(),
      balanceFinal,
      balanceEsperado,
      diferencia,
      observaciones,
    },
  })
  if (cerrada.count === 0) return { error: 'La caja ya fue cerrada.' }

  await prisma.auditLog.create({
    data: {
      companyId: auth.companyId,
      userId: auth.userId,
      accion: 'CAJA_CERRADA',
      entidadTipo: 'CajaSesion',
      entidadId: cajaSesionId,
      payload: {
        sucursal: sesion.sucursal.nombre,
        balanceFinal,
        balanceEsperado,
        diferencia,
        observaciones,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  })

  revalidatePath('/empleado/caja')
  const signo = diferencia === 0 ? 'cuadrada' : diferencia > 0 ? `sobrante RD$${diferencia.toFixed(2)}` : `faltante RD$${Math.abs(diferencia).toFixed(2)}`
  return { success: true, detalle: `Caja cerrada (${signo}).` }
}

export async function cobrarOrden(
  _prev: CajaActionState,
  formData: FormData
): Promise<CajaActionState> {
  const auth = await staffAutorizado()
  if (!auth) return { error: 'No autorizado.' }
  if (!formSubmitLimiter(`cobro:${auth.userId}`)) {
    return { error: 'Demasiados intentos. Espera un momento.' }
  }

  const cajaSesionId = String(formData.get('cajaSesionId') ?? '').trim()
  const ordenTipo = String(formData.get('ordenTipo') ?? '').trim()
  const ordenId = String(formData.get('ordenId') ?? '').trim()
  const metodoCobro = String(formData.get('metodoCobro') ?? '').trim()
  const observaciones = String(formData.get('observaciones') ?? '').trim() || null

  if (!cajaSesionId || !ordenId) return { error: 'Datos incompletos.' }
  if (!['MEMBRESIA', 'PROMOCION'].includes(ordenTipo)) return { error: 'Tipo de orden no válido.' }
  if (!['EFECTIVO', 'TRANSFERENCIA', 'OTRO'].includes(metodoCobro)) {
    return { error: 'Selecciona la forma de pago.' }
  }

  // La caja debe estar ABIERTA y ser de la empresa del empleado.
  const sesion = await prisma.cajaSesion.findFirst({
    where: { id: cajaSesionId, companyId: auth.companyId, estado: 'ABIERTA' },
    select: { id: true, sucursalId: true, sucursal: { select: { nombre: true } } },
  })
  if (!sesion) return { error: 'La caja está cerrada: ábrela para poder cobrar.' }

  const meta = await getRequestMeta()
  const metaAct = { ipAddress: meta.ipAddress ?? null, userAgent: meta.userAgent ?? null }

  let clienteId: string
  let clienteNombre: string
  let clienteUserId: string | null = null
  let detalle: string
  let monto: number
  let membershipId: string | null = null

  if (ordenTipo === 'MEMBRESIA') {
    const m = await prisma.membership.findFirst({
      where: { id: ordenId, cliente: { companyId: auth.companyId } },
      include: {
        cliente: { select: { id: true, nombre: true, supabaseId: true } },
        plan: { select: { nombre: true, precio: true } },
        planSolicitado: { select: { nombre: true, precio: true } },
      },
    })
    if (!m) return { error: 'Orden no encontrada.' }
    const esCambio = m.estado === 'ACTIVA' && m.planIdSolicitado != null
    if (m.estado === 'ACTIVA' && !esCambio) return { error: 'Esta membresía ya está activa (cobro duplicado).' }

    const plan = esCambio ? m.planSolicitado : m.plan
    const descuento = m.fechaInicio == null ? Number(m.descuentoBienvenida ?? 0) : 0
    monto = Math.max(0, Number(plan?.precio ?? 0) - descuento)
    clienteId = m.cliente.id
    clienteNombre = m.cliente.nombre
    detalle = `${esCambio ? 'Cambio a ' : 'Plan '}${plan?.nombre ?? ''}`.trim()
    membershipId = m.id

    // Activación (punto único): genera QR, aplica cambio de plan y registra
    // el historial. Rechaza estados no activables → anti doble-cobro.
    const res = await activarMembresia(m.id, auth.userId, metaAct)
    if (!res.ok) return { error: res.error }

    const u = await prisma.user.findUnique({ where: { supabaseId: res.supabaseId }, select: { id: true } })
    clienteUserId = u?.id ?? null
  } else {
    const c = await prisma.productoCompra.findFirst({
      where: { id: ordenId, companyId: auth.companyId },
      include: {
        cliente: { select: { id: true, nombre: true, supabaseId: true } },
        promocion: { select: { titulo: true, precio: true } },
      },
    })
    if (!c) return { error: 'Orden no encontrada.' }
    if (c.estado === 'ACTIVA') return { error: 'Esta compra ya está activa (cobro duplicado).' }

    monto = Number(c.precioCongelado ?? c.promocion?.precio ?? 0)
    clienteId = c.cliente.id
    clienteNombre = c.cliente.nombre
    detalle = `Promoción ${c.promocion?.titulo ?? ''}`.trim()

    const res = await activarCompraPromocion(c.id, auth.userId, metaAct, {
      motivo: `Cobro en caja (${metodoCobro.toLowerCase()})`,
    })
    if (!res.ok) return { error: res.error }

    const u = await prisma.user.findUnique({
      where: { supabaseId: c.cliente.supabaseId ?? '' },
      select: { id: true },
    })
    clienteUserId = u?.id ?? null
  }

  // Transacción de venta: historial permanente del cobro (quién, dónde, caja,
  // método, monto, observaciones) con ticket y código TX únicos.
  const tx = await crearTransaccionAplicada(prisma, {
    tipo: 'SALE',
    companyId: auth.companyId,
    sucursalId: sesion.sucursalId,
    clienteId,
    empleadoId: auth.userId,
    caja: sesion.sucursal.nombre,
    cajaSesionId: sesion.id,
    monto,
    metodoCobro: metodoCobro as 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO',
    membershipId,
    snapshot: {
      detalle,
      cliente: clienteNombre,
      ordenTipo,
      ordenId,
      observaciones,
    },
    auditoria: { ipAddress: meta.ipAddress, userAgent: meta.userAgent },
    resultado: observaciones,
    userId: auth.userId,
  })

  await prisma.auditLog.create({
    data: {
      companyId: auth.companyId,
      userId: auth.userId,
      accion: 'COBRO_REGISTRADO',
      entidadTipo: ordenTipo === 'MEMBRESIA' ? 'Membership' : 'ProductoCompra',
      entidadId: ordenId,
      payload: { codigo: tx.codigo, monto, metodoCobro, detalle, cajaSesionId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  })

  // Aviso al cliente: su pago quedó confirmado y el beneficio activo.
  if (clienteUserId) {
    await crearNotificacion({
      userId: clienteUserId,
      tipo: 'PAGO_APROBADO',
      titulo: 'Pago recibido en sucursal',
      mensaje: `Recibimos tu pago de RD$${monto.toLocaleString('es-DO')} (${detalle}). ¡Ya está activo!`,
      href: ordenTipo === 'MEMBRESIA' ? `/membresia/${ordenId}` : `/cliente/mis-promociones/${ordenId}`,
    }).catch(() => {})
  }

  revalidatePath('/empleado/caja')
  return { success: true, detalle: `Cobro registrado · ${tx.codigo} (ticket ${tx.ticketNumero}).` }
}
