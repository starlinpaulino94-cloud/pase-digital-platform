/**
 * Límites configurables del programa (Fase D): topes por día/semana/mes,
 * máximo de recompensas, presupuesto y expiración. Evaluación pura contra un
 * contexto de contadores ya calculados por el repositorio.
 */

import type { ReferralLimits } from './types'

export type LimitDenyCode =
  | 'EXPIRED'
  | 'DAILY_LIMIT'
  | 'WEEKLY_LIMIT'
  | 'MONTHLY_LIMIT'
  | 'MAX_REWARDS'
  | 'BUDGET_EXCEEDED'

export interface LimitContext {
  readonly now?: Date
  /** Referidos registrados hoy / esta semana / este mes (por participante o programa). */
  readonly todayCount?: number
  readonly weekCount?: number
  readonly monthCount?: number
  /** Recompensas ya liberadas en el programa. */
  readonly rewardsReleased?: number
  /** Costo real acumulado de recompensas liberadas. */
  readonly budgetSpent?: number
  /** Costo real de la recompensa que se evaluaría liberar ahora. */
  readonly nextRewardCost?: number
}

export interface LimitResult {
  readonly allowed: boolean
  readonly denials: readonly LimitDenyCode[]
}

/** Evalúa los límites del programa. Nunca lanza. */
export function checkLimits(
  limits: ReferralLimits | undefined,
  ctx: LimitContext = {},
): LimitResult {
  if (!limits) return { allowed: true, denials: [] }
  const now = ctx.now ?? new Date()
  const denials: LimitDenyCode[] = []

  if (limits.expiresAt && now > new Date(limits.expiresAt)) denials.push('EXPIRED')
  if (limits.maxPerDay != null && (ctx.todayCount ?? 0) >= limits.maxPerDay) denials.push('DAILY_LIMIT')
  if (limits.maxPerWeek != null && (ctx.weekCount ?? 0) >= limits.maxPerWeek) denials.push('WEEKLY_LIMIT')
  if (limits.maxPerMonth != null && (ctx.monthCount ?? 0) >= limits.maxPerMonth) denials.push('MONTHLY_LIMIT')
  if (limits.maxRewards != null && (ctx.rewardsReleased ?? 0) >= limits.maxRewards) denials.push('MAX_REWARDS')
  if (
    limits.maxBudget != null &&
    (ctx.budgetSpent ?? 0) + (ctx.nextRewardCost ?? 0) > limits.maxBudget
  ) {
    denials.push('BUDGET_EXCEEDED')
  }

  return { allowed: denials.length === 0, denials }
}
