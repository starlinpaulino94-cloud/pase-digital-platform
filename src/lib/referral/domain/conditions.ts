/**
 * Condiciones configurables del referido (Fase D). La recompensa depende del
 * VALOR generado, no solo de compartir un enlace. Cada programa define qué debe
 * cumplir el referido; aquí están el catálogo y un evaluador puro contra un
 * contexto de hechos del referido.
 */

import type { ReferralCondition } from './types'

export const REFERRAL_CONDITIONS = {
  MIN_PURCHASES: 'min_purchases', // cantidad mínima de compras
  MIN_AMOUNT: 'min_amount', // monto mínimo gastado
  MIN_TENURE_DAYS: 'min_tenure_days', // tiempo mínimo como cliente
  FIRST_PURCHASE: 'first_purchase', // hizo su primera compra
  SECOND_PURCHASE: 'second_purchase', // hizo su segunda compra
  ACTIVE_CLIENT: 'active_client', // es cliente activo
  ACTIVE_MEMBERSHIP: 'active_membership', // tiene membresía activa
  NO_RETURNS: 'no_returns', // sin devoluciones
  PAYMENT_CONFIRMED: 'payment_confirmed', // pago confirmado
} as const

export type ReferralConditionKey =
  (typeof REFERRAL_CONDITIONS)[keyof typeof REFERRAL_CONDITIONS]

export interface ReferralConditionDef {
  readonly id: ReferralConditionKey
  readonly name: string
  readonly description: string
  /** ¿Requiere un valor numérico (monto, cantidad, días)? */
  readonly needsValue: boolean
}

export const REFERRAL_CONDITION_CATALOG: readonly ReferralConditionDef[] = [
  { id: REFERRAL_CONDITIONS.MIN_PURCHASES, name: 'Compras mínimas', description: 'Cantidad mínima de compras del referido.', needsValue: true },
  { id: REFERRAL_CONDITIONS.MIN_AMOUNT, name: 'Monto mínimo', description: 'Monto mínimo gastado por el referido.', needsValue: true },
  { id: REFERRAL_CONDITIONS.MIN_TENURE_DAYS, name: 'Antigüedad mínima', description: 'Días mínimos como cliente.', needsValue: true },
  { id: REFERRAL_CONDITIONS.FIRST_PURCHASE, name: 'Primera compra', description: 'Realizó su primera compra.', needsValue: false },
  { id: REFERRAL_CONDITIONS.SECOND_PURCHASE, name: 'Segunda compra', description: 'Realizó su segunda compra.', needsValue: false },
  { id: REFERRAL_CONDITIONS.ACTIVE_CLIENT, name: 'Cliente activo', description: 'Es un cliente activo.', needsValue: false },
  { id: REFERRAL_CONDITIONS.ACTIVE_MEMBERSHIP, name: 'Membresía activa', description: 'Tiene una membresía activa.', needsValue: false },
  { id: REFERRAL_CONDITIONS.NO_RETURNS, name: 'Sin devoluciones', description: 'No registra devoluciones.', needsValue: false },
  { id: REFERRAL_CONDITIONS.PAYMENT_CONFIRMED, name: 'Pago confirmado', description: 'Su pago fue confirmado.', needsValue: false },
]

/** Hechos del referido para evaluar condiciones. */
export interface ReferralFacts {
  readonly purchases?: number
  readonly amountSpent?: number
  readonly tenureDays?: number
  readonly isActive?: boolean
  readonly hasActiveMembership?: boolean
  readonly hasReturns?: boolean
  readonly paymentConfirmed?: boolean
}

export interface ConditionsResult {
  readonly met: boolean
  /** Condiciones NO cumplidas (claves). */
  readonly failed: readonly string[]
}

/** Evalúa una condición individual contra los hechos. */
function evalCondition(cond: ReferralCondition, f: ReferralFacts): boolean {
  switch (cond.type) {
    case REFERRAL_CONDITIONS.MIN_PURCHASES:
      return (f.purchases ?? 0) >= (cond.value ?? 1)
    case REFERRAL_CONDITIONS.MIN_AMOUNT:
      return (f.amountSpent ?? 0) >= (cond.value ?? 0)
    case REFERRAL_CONDITIONS.MIN_TENURE_DAYS:
      return (f.tenureDays ?? 0) >= (cond.value ?? 0)
    case REFERRAL_CONDITIONS.FIRST_PURCHASE:
      return (f.purchases ?? 0) >= 1
    case REFERRAL_CONDITIONS.SECOND_PURCHASE:
      return (f.purchases ?? 0) >= 2
    case REFERRAL_CONDITIONS.ACTIVE_CLIENT:
      return f.isActive === true
    case REFERRAL_CONDITIONS.ACTIVE_MEMBERSHIP:
      return f.hasActiveMembership === true
    case REFERRAL_CONDITIONS.NO_RETURNS:
      return f.hasReturns !== true
    case REFERRAL_CONDITIONS.PAYMENT_CONFIRMED:
      return f.paymentConfirmed === true
    default:
      // Condición desconocida: no bloquea (Open/Closed; la evalúa otro motor).
      return true
  }
}

/** Evalúa TODAS las condiciones de un programa (AND). Nunca lanza. */
export function evaluateConditions(
  conditions: readonly ReferralCondition[] | undefined,
  facts: ReferralFacts,
): ConditionsResult {
  if (!conditions || conditions.length === 0) return { met: true, failed: [] }
  const failed = conditions.filter((c) => !evalCondition(c, facts)).map((c) => c.type)
  return { met: failed.length === 0, failed }
}
