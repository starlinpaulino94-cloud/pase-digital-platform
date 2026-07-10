/**
 * Evaluación de límites/reglas de uso (Fase A).
 *
 * Función PURA que decide si un uso está permitido según los límites del plan y
 * el historial reciente: servicios permitidos, máximo por período, intervalo
 * mínimo entre usos y créditos restantes. Las reglas complejas (expresiones BEL)
 * las evalúa el UsageTracker con el motor de expresiones.
 */

import type {
  MembershipInstance,
  MembershipPlan,
  MembershipUsageRecord,
  UsagePeriod,
} from './types'

export type UsageDenyCode =
  | 'SERVICE_NOT_ALLOWED'
  | 'PERIOD_LIMIT_REACHED'
  | 'MIN_INTERVAL'
  | 'NO_CREDITS'
  | 'INACTIVE'

export interface UsageDecision {
  readonly allowed: boolean
  readonly code?: UsageDenyCode
  readonly reason?: string
}

export interface UsageCheckInput {
  readonly plan: MembershipPlan
  readonly instance: MembershipInstance
  readonly service: string
  readonly at: Date
  /** Usos previos de la instancia (los relevantes al período; el resto se ignora). */
  readonly recentUsage: readonly MembershipUsageRecord[]
}

function startOfPeriod(at: Date, period: UsagePeriod): Date {
  const d = new Date(at)
  d.setHours(0, 0, 0, 0)
  if (period === 'WEEK') {
    const day = (d.getDay() + 6) % 7 // lunes = 0
    d.setDate(d.getDate() - day)
  } else if (period === 'MONTH') {
    d.setDate(1)
  }
  return d
}

const ALLOWED = { allowed: true } as const

/** Decide si el uso solicitado está permitido. */
export function evaluateUsage(input: UsageCheckInput): UsageDecision {
  const { plan, instance, service, at, recentUsage } = input
  const limits = plan.config.limits ?? {}

  if (instance.status !== 'ACTIVE') {
    return { allowed: false, code: 'INACTIVE', reason: `La membresía está ${instance.status}.` }
  }

  // Servicio permitido: allowedServices (si existe) o includedServices del plan.
  const allowedServices = limits.allowedServices ?? plan.config.includedServices
  if (allowedServices && allowedServices.length > 0 && !allowedServices.includes(service)) {
    return { allowed: false, code: 'SERVICE_NOT_ALLOWED', reason: `El servicio "${service}" no está incluido.` }
  }

  // Créditos (planes no ilimitados que llevan créditos).
  if (!plan.unlimited && instance.creditsRemaining !== null && instance.creditsRemaining <= 0) {
    return { allowed: false, code: 'NO_CREDITS', reason: 'No quedan créditos disponibles.' }
  }

  // Intervalo mínimo entre usos.
  if (limits.minIntervalMinutes && limits.minIntervalMinutes > 0) {
    const last = recentUsage.reduce<Date | null>((acc, u) => {
      const t = new Date(u.usedAt)
      return t <= at && (!acc || t > acc) ? t : acc
    }, null)
    if (last) {
      const mins = (at.getTime() - last.getTime()) / 60_000
      if (mins < limits.minIntervalMinutes) {
        return { allowed: false, code: 'MIN_INTERVAL', reason: `Debe esperar ${limits.minIntervalMinutes} min entre usos.` }
      }
    }
  }

  // Máximo por período.
  if (limits.maxPerPeriod) {
    const from = startOfPeriod(at, limits.maxPerPeriod.period)
    const used = recentUsage
      .filter((u) => new Date(u.usedAt) >= from && new Date(u.usedAt) <= at)
      .reduce((sum, u) => sum + u.quantity, 0)
    if (used >= limits.maxPerPeriod.count) {
      return {
        allowed: false,
        code: 'PERIOD_LIMIT_REACHED',
        reason: `Límite alcanzado: ${limits.maxPerPeriod.count} por ${limits.maxPerPeriod.period.toLowerCase()}.`,
      }
    }
  }

  return ALLOWED
}
