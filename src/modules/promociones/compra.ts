/**
 * Fase E5 · Productos Comerciales — dominio de compras de promoción.
 *
 * Helpers server-internal (SIN 'use server'): validación de consumo (el
 * "Rule Engine" de la compra: estado, vigencias, usos, días, horarios,
 * empresa) y registro de transiciones de estado. Los llamadores son las
 * acciones del cliente, del admin y del escáner.
 */

import type { Prisma, PrismaClient, CompraEstado } from '@prisma/client'

export type Db = PrismaClient | Prisma.TransactionClient

// ── Transiciones ─────────────────────────────────────────────────────────────

/** Transiciones válidas del ciclo de compra (espejo del Transaction Engine). */
export const COMPRA_TRANSICIONES: Record<CompraEstado, CompraEstado[]> = {
  SOLICITADA: ['PENDIENTE_PAGO', 'EN_VALIDACION', 'ACTIVA', 'CANCELADA', 'EXPIRADA'],
  PENDIENTE_PAGO: ['EN_VALIDACION', 'CANCELADA', 'EXPIRADA'],
  EN_VALIDACION: ['APROBADA', 'ACTIVA', 'RECHAZADA', 'CANCELADA'],
  APROBADA: ['ACTIVA', 'CANCELADA'],
  RECHAZADA: ['EN_VALIDACION', 'ACTIVA', 'CANCELADA'], // reintento de comprobante
  ACTIVA: ['CONSUMIDA', 'EXPIRADA', 'CANCELADA'],
  CONSUMIDA: [],
  EXPIRADA: [],
  CANCELADA: [],
}

export function esTransicionCompraValida(desde: CompraEstado, hacia: CompraEstado): boolean {
  return COMPRA_TRANSICIONES[desde]?.includes(hacia) ?? false
}

/**
 * Registra el cambio de estado en la bitácora inmutable. Llamar SIEMPRE que
 * se cambie `ProductoCompra.estado` (idealmente dentro del mismo $transaction).
 */
export async function registrarTransicionCompra(
  db: Db,
  input: {
    compraId: string
    desde: CompraEstado | null
    hacia: CompraEstado
    motivo?: string | null
    userId?: string | null
  }
) {
  await db.productoCompraTransicion.create({
    data: {
      compraId: input.compraId,
      desde: input.desde,
      hacia: input.hacia,
      motivo: input.motivo ?? null,
      userId: input.userId ?? null,
    },
  })
}

// ── Validación de consumo (escáner) ──────────────────────────────────────────

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

interface CompraParaValidar {
  estado: CompraEstado
  usosRestantes: number
  fechaVencimiento: Date | null
}

interface PromoRestricciones {
  diasPermitidos: number[]
  horaDesde: string | null
  horaHasta: string | null
}

export interface ValidacionConsumo {
  puedeUsar: boolean
  mensaje?: string
  /** true → la compra debe marcarse EXPIRADA (lazy) por el llamador. */
  expiro?: boolean
}

function ahoraEnZona(now: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]))
  const diaIdx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  // Algunos runtimes devuelven "24" para medianoche con hour12:false.
  const hora = `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`
  return { diaIdx, hora }
}

/**
 * Reglas de consumo de una compra activa: estado → vencimiento → usos →
 * día permitido → horario. La pertenencia a la empresa/sucursal la valida
 * el llamador (depende del usuario que escanea).
 */
export function validarConsumoCompra(
  compra: CompraParaValidar,
  promo: PromoRestricciones,
  now = new Date(),
  timeZone = 'America/Santo_Domingo'
): ValidacionConsumo {
  if (compra.estado !== 'ACTIVA') {
    const map: Partial<Record<CompraEstado, string>> = {
      SOLICITADA: 'La compra está solicitada pero aún sin pagar.',
      PENDIENTE_PAGO: 'La compra está esperando el pago del cliente.',
      EN_VALIDACION: 'El comprobante está pendiente de validación.',
      APROBADA: 'La compra está aprobada pero aún no activada.',
      RECHAZADA: 'El pago de esta promoción fue rechazado.',
      CONSUMIDA: 'Esta promoción ya fue consumida por completo.',
      EXPIRADA: 'Esta promoción venció sin usarse.',
      CANCELADA: 'Esta compra fue cancelada.',
    }
    return { puedeUsar: false, mensaje: map[compra.estado] ?? 'La promoción no está activa.' }
  }
  if (compra.fechaVencimiento && compra.fechaVencimiento <= now) {
    return { puedeUsar: false, mensaje: 'La vigencia de esta promoción ha vencido.', expiro: true }
  }
  if (compra.usosRestantes <= 0) {
    return { puedeUsar: false, mensaje: 'No quedan usos disponibles en esta promoción.' }
  }

  const { diaIdx, hora } = ahoraEnZona(now, timeZone)
  if (promo.diasPermitidos.length > 0 && !promo.diasPermitidos.includes(diaIdx)) {
    const dias = promo.diasPermitidos
      .slice()
      .sort()
      .map((d) => DIAS[d] ?? String(d))
      .join(', ')
    return { puedeUsar: false, mensaje: `Esta promoción solo es válida los días: ${dias}.` }
  }
  if (promo.horaDesde && hora < promo.horaDesde) {
    return { puedeUsar: false, mensaje: `Esta promoción es válida a partir de las ${promo.horaDesde}.` }
  }
  if (promo.horaHasta && hora > promo.horaHasta) {
    return { puedeUsar: false, mensaje: `Esta promoción es válida hasta las ${promo.horaHasta}.` }
  }
  return { puedeUsar: true }
}

// ── Ventana de adquisición ───────────────────────────────────────────────────

export interface PromoComprable {
  activo: boolean
  archivada: boolean
  esComprable: boolean
  vigenciaDesde: Date
  vigenciaHasta: Date | null
  maxCanjes: number | null
  canjes: number
}

/** Ventana de adquisición + cupo: ¿puede comprarse AHORA? */
export function validarVentanaAdquisicion(promo: PromoComprable, now = new Date()): {
  ok: boolean
  mensaje?: string
} {
  if (!promo.esComprable) return { ok: false, mensaje: 'Esta promoción no está a la venta.' }
  if (!promo.activo || promo.archivada) {
    return { ok: false, mensaje: 'Esta promoción ya no está disponible.' }
  }
  if (promo.vigenciaDesde > now) {
    return { ok: false, mensaje: 'Esta promoción aún no está disponible para compra.' }
  }
  if (promo.vigenciaHasta && promo.vigenciaHasta < now) {
    return { ok: false, mensaje: 'La ventana de compra de esta promoción ya cerró.' }
  }
  if (promo.maxCanjes != null && promo.canjes >= promo.maxCanjes) {
    return { ok: false, mensaje: 'Esta promoción está agotada.' }
  }
  return { ok: true }
}

/** Vencimiento del beneficio al activar: días desde activación o fecha fija. */
export function calcularVencimientoBeneficio(
  promo: { beneficioVigenciaDias: number | null; beneficioVigenciaHasta: Date | null },
  activacion = new Date()
): Date | null {
  if (promo.beneficioVigenciaDias != null && promo.beneficioVigenciaDias > 0) {
    const d = new Date(activacion)
    d.setDate(d.getDate() + promo.beneficioVigenciaDias)
    return d
  }
  return promo.beneficioVigenciaHasta ?? null
}
