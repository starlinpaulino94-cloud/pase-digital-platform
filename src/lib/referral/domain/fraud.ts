/**
 * Prevención de fraude del Referral Engine (Fase D). Cada regla es
 * activable/desactivable por la empresa. La evaluación es pura: recibe señales
 * ya calculadas (duplicados, huellas repetidas…) y devuelve si el referido es
 * sospechoso y qué reglas se dispararon. Un referido sospechoso se conserva
 * para auditoría pero NO libera recompensa (misma filosofía que el sistema en
 * vivo).
 */

import type { ReferralFraudRules } from './types'

export type FraudReasonCode =
  | 'SELF_REFERRAL'
  | 'DUPLICATE_EMAIL'
  | 'DUPLICATE_PHONE'
  | 'REPEATED_DEVICE'
  | 'MULTIPLE_ACCOUNTS'
  | 'IP_ABUSE'
  | 'NO_REAL_PURCHASE'

/** Señales observadas del referido (las calcula el repositorio/infra). */
export interface FraudSignals {
  /** El referido es la misma persona que el referente. */
  readonly isSelfReferral?: boolean
  readonly duplicateEmail?: boolean
  readonly duplicatePhone?: boolean
  readonly repeatedDevice?: boolean
  readonly multipleAccounts?: boolean
  /** Registros desde la misma huella de IP en la ventana. */
  readonly ipCount?: number
  /** ¿Hizo una compra real? (para requireRealPurchase). */
  readonly hasRealPurchase?: boolean
}

export interface FraudResult {
  readonly suspicious: boolean
  readonly reasons: readonly FraudReasonCode[]
}

/**
 * Evalúa las reglas antifraude ACTIVADAS del programa contra las señales.
 * Solo las reglas encendidas cuentan (Open/Closed por configuración).
 */
export function evaluateFraud(
  rules: ReferralFraudRules | undefined,
  signals: FraudSignals,
): FraudResult {
  if (!rules) return { suspicious: false, reasons: [] }
  const reasons: FraudReasonCode[] = []

  if (rules.blockSelfReferral && signals.isSelfReferral) reasons.push('SELF_REFERRAL')
  if (rules.blockDuplicateEmail && signals.duplicateEmail) reasons.push('DUPLICATE_EMAIL')
  if (rules.blockDuplicatePhone && signals.duplicatePhone) reasons.push('DUPLICATE_PHONE')
  if (rules.blockRepeatedDevice && signals.repeatedDevice) reasons.push('REPEATED_DEVICE')
  if (rules.blockMultipleAccounts && signals.multipleAccounts) reasons.push('MULTIPLE_ACCOUNTS')
  if (rules.maxPerIp != null && (signals.ipCount ?? 0) > rules.maxPerIp) reasons.push('IP_ABUSE')
  if (rules.requireRealPurchase && signals.hasRealPurchase === false) reasons.push('NO_REAL_PURCHASE')

  return { suspicious: reasons.length > 0, reasons }
}

/** Reglas antifraude recomendadas por defecto (todas activas menos device). */
export const DEFAULT_FRAUD_RULES: ReferralFraudRules = {
  blockSelfReferral: true,
  blockDuplicateEmail: true,
  blockDuplicatePhone: true,
  blockRepeatedDevice: false,
  blockMultipleAccounts: true,
  maxPerIp: 3,
  requireRealPurchase: true,
}
