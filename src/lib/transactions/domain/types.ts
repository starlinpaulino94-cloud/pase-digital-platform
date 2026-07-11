/**
 * Tipos de dominio del Transaction Engine (Fase E4).
 *
 * Una transacción es el registro OFICIAL de cualquier operación dentro de
 * MembeGo (redención de membresía, uso de promoción/beneficio/cupón, canje de
 * recompensa, consumo de puntos, referidos, ventas/compras futuras). Universal:
 * cero lógica de industria; la especificidad vive en `snapshot` (etiquetas
 * congeladas) y en las plantillas del Receipt Engine.
 */

export type TransactionTipo =
  | 'MEMBERSHIP_REDEMPTION'
  | 'PROMOTION_USE'
  | 'BENEFIT_USE'
  | 'REWARD_REDEMPTION'
  | 'COUPON_USE'
  | 'POINTS_SPEND'
  | 'REFERRAL'
  | 'SALE'
  | 'PURCHASE'
  | 'OTHER'

export type TransactionEstado =
  | 'PENDING'
  | 'VALIDATING'
  | 'APPROVED'
  | 'APPLIED'
  | 'CANCELLED'
  | 'REVERTED'
  | 'EXPIRED'
  | 'ERROR'

/**
 * Etiquetas congeladas al momento de la operación: el historial y el ticket
 * no cambian aunque después cambien los datos maestros.
 */
export interface TransactionSnapshot {
  readonly cliente?: string
  readonly vehiculo?: string
  readonly placa?: string
  readonly servicio?: string
  readonly promocion?: string
  readonly beneficio?: string
  readonly membresia?: string
  readonly plan?: string
  readonly puntos?: number
  readonly nivel?: string
  readonly empleado?: string
  readonly sucursal?: string
  readonly empresa?: string
  readonly descuento?: string
  readonly subtotal?: string
  readonly total?: string
  readonly restantes?: number | 'ilimitado'
  readonly [extra: string]: unknown
}

/** Auditoría técnica de la operación. */
export interface TransactionAuditoria {
  readonly ipAddress?: string | null
  readonly userAgent?: string | null
  readonly dispositivo?: string | null
  readonly navegador?: string | null
  readonly [extra: string]: unknown
}

export interface TransactionRecord {
  readonly id: string
  readonly codigo: string
  readonly ticketNumero: string
  readonly tipo: TransactionTipo
  readonly estado: TransactionEstado
  readonly companyId: string
  readonly sucursalId: string | null
  readonly clienteId: string | null
  readonly empleadoId: string | null
  readonly caja: string | null
  readonly membershipId: string | null
  readonly visitId: string | null
  readonly qrTokenUsadoId: string | null
  readonly snapshot: TransactionSnapshot
  readonly auditoria: TransactionAuditoria
  readonly resultado: string | null
  readonly errorDetalle: string | null
  readonly executionMs: number | null
  readonly createdAt: Date
  readonly appliedAt: Date | null
  readonly cancelledAt: Date | null
  readonly revertedAt: Date | null
}

export interface TransactionTransicionRecord {
  readonly id: string
  readonly desde: TransactionEstado | null
  readonly hacia: TransactionEstado
  readonly motivo: string | null
  readonly userId: string | null
  readonly createdAt: Date
}
