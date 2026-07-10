/**
 * Membership Engine universal (Fase A) — API pública y composition root.
 *
 * Modela cualquier modelo comercial de membresía (los 20 de la Strategy Library)
 * por CONFIGURACIÓN, sobre los motores existentes (Rule/Action/Context/BEL). La
 * especificidad de industria vive en plantillas (`templates/`), no en el motor.
 *
 * @example
 *   import { createMembershipService, CARWASH_MEMBERSHIP_TEMPLATES, instantiateTemplate } from '@/lib/membership'
 *   const memberships = createMembershipService()
 *   const tpl = CARWASH_MEMBERSHIP_TEMPLATES.find(t => t.key === 'carwash.unlimited_premium')!
 *   const plan = await memberships.createPlan(instantiateTemplate(tpl, companyId, { price: 1599 }))
 *   const sub = await memberships.subscribe({ companyId, planId: plan.id, subscriberId: clienteId })
 */

import { prisma } from '@/lib/prisma'
import { MembershipService } from './application/membership-service'
import { UsageTracker, type UsageTrackerDeps } from './application/usage-tracker'
import type { MembershipRepository } from './application/ports'
import { PrismaMembershipRepository } from './infrastructure/prisma-membership-repository'
import type { ExpressionService } from '@/lib/bel'

export interface CreateMembershipServiceOptions {
  repository?: MembershipRepository
}

/** Composition root del servicio de membresías. */
export function createMembershipService(
  options: CreateMembershipServiceOptions = {},
): MembershipService {
  const repository = options.repository ?? new PrismaMembershipRepository(prisma)
  return new MembershipService(repository)
}

/** Composition root del rastreador de uso. */
export function createUsageTracker(options: {
  repository?: MembershipRepository
  expressions?: ExpressionService
} = {}): UsageTracker {
  const repository = options.repository ?? new PrismaMembershipRepository(prisma)
  const deps: UsageTrackerDeps = { repo: repository, expressions: options.expressions }
  return new UsageTracker(deps)
}

// ── Re-exports públicos ─────────────────────────────────────────────────────
export type {
  MembershipPlan, MembershipInstance, MembershipUsageRecord, MembershipVehicle,
  MembershipPlanType, MembershipPeriodicity, MembershipPlanStatus,
  MembershipInstanceStatus, MembershipConfig, MembershipLimits, MembershipRenewal,
  UsagePeriod, WeekDay, MembershipSchedule, MembershipLifecycleRules,
} from './domain/types'
export {
  MEMBERSHIP_TRANSITIONS, canTransition, validateTransition,
} from './domain/lifecycle'
export { evaluateUsage } from './domain/limits'
export type { UsageDecision, UsageDenyCode, UsageCheckInput } from './domain/limits'
export { MEMBERSHIP_METRICS, MEMBERSHIP_METRIC_CATALOG } from './domain/metrics'
export type { MembershipMetricKey, MembershipMetricDef } from './domain/metrics'

export { MembershipService, MembershipError } from './application/membership-service'
export type { MembershipResult } from './application/membership-service'
export { UsageTracker } from './application/usage-tracker'
export type {
  UsageTrackerDeps, RegisterUsageInput, RegisterUsageResult,
} from './application/usage-tracker'
export type {
  MembershipRepository, CreatePlanData, UpdatePlanData, SubscribeData,
} from './application/ports'

export { instantiateTemplate } from './templates/types'
export type { MembershipTemplate, InstantiateOverrides } from './templates/types'
export {
  CARWASH_MEMBERSHIP_TEMPLATES, getCarwashTemplate, CARWASH_MEMBERSHIP_BY_TYPE,
  carwashMembershipByType, carwashMembershipByTier,
} from './templates/carwash'

export { PrismaMembershipRepository } from './infrastructure/prisma-membership-repository'
export { mapPlan, mapInstance, mapUsage } from './infrastructure/mappers'
