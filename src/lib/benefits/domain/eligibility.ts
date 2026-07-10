/**
 * Elegibilidad de un beneficio (Fase C). Evalúa las restricciones del Benefit
 * Engine (segmento, servicio, disponibilidad, stock, frecuencia de canje) de
 * forma pura y determinista. Las reglas BEL adicionales (`customRules`) las
 * evalúa quien tenga el ExpressionService; aquí solo se reportan como pendientes.
 */

import type { Benefit } from './types'

export type EligibilityDenyCode =
  | 'NOT_PUBLISHED'
  | 'OUT_OF_WINDOW'
  | 'OUT_OF_STOCK'
  | 'SEGMENT_NOT_ALLOWED'
  | 'SERVICE_NOT_ALLOWED'
  | 'TIER_REQUIRED'
  | 'MAX_REDEMPTIONS_REACHED'

export interface EligibilityContext {
  /** Momento de la evaluación (default: ahora). */
  readonly now?: Date
  /** Segmento del suscriptor (ej. "vip"). */
  readonly segment?: string
  /** Nivel/plan del suscriptor (ej. "gold"). */
  readonly tier?: string
  /** Servicio sobre el que se quiere aplicar. */
  readonly service?: string
  /** Canjes ya realizados por el suscriptor en la ventana vigente. */
  readonly redemptionsInWindow?: number
  /** Stock ya consumido del beneficio (grants canjeados). */
  readonly stockConsumed?: number
}

export interface EligibilityResult {
  readonly eligible: boolean
  readonly denials: readonly EligibilityDenyCode[]
  /** Reglas BEL que quedan por evaluar fuera de este motor puro. */
  readonly pendingRules: readonly string[]
}

/** Evalúa si un beneficio puede entregarse/canjearse en un contexto dado. */
export function checkEligibility(
  benefit: Benefit,
  ctx: EligibilityContext = {},
): EligibilityResult {
  const now = ctx.now ?? new Date()
  const denials: EligibilityDenyCode[] = []
  const r = benefit.config.restrictions
  const a = benefit.config.availability

  if (benefit.status !== 'PUBLISHED') denials.push('NOT_PUBLISHED')

  // Ventana de disponibilidad.
  if (a?.availableFrom && now < new Date(a.availableFrom)) denials.push('OUT_OF_WINDOW')
  if (a?.availableUntil && now > new Date(a.availableUntil)) denials.push('OUT_OF_WINDOW')

  // Stock.
  if (a?.stock != null && (ctx.stockConsumed ?? 0) >= a.stock) denials.push('OUT_OF_STOCK')

  // Segmento.
  if (r?.segments && r.segments.length > 0) {
    if (!ctx.segment || !r.segments.includes(ctx.segment)) denials.push('SEGMENT_NOT_ALLOWED')
  }

  // Servicio aplicable.
  if (r?.applicableServices && r.applicableServices.length > 0) {
    if (!ctx.service || !r.applicableServices.includes(ctx.service)) denials.push('SERVICE_NOT_ALLOWED')
  }

  // Nivel/tier requerido.
  if (r?.requiresTier && ctx.tier !== r.requiresTier) denials.push('TIER_REQUIRED')

  // Frecuencia de canje.
  if (r?.maxRedemptions != null && (ctx.redemptionsInWindow ?? 0) >= r.maxRedemptions) {
    denials.push('MAX_REDEMPTIONS_REACHED')
  }

  return {
    eligible: denials.length === 0,
    denials,
    pendingRules: r?.customRules ?? [],
  }
}

/** Fecha de expiración de un grant según `validDays` (o null si no aplica). */
export function grantExpiry(benefit: Benefit, grantedAt: Date): Date | null {
  const days = benefit.config.restrictions?.validDays
  if (!days || days <= 0) return null
  const d = new Date(grantedAt)
  d.setDate(d.getDate() + days)
  return d
}
