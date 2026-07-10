/**
 * Evaluación de políticas del Benefit Transformation Engine.
 *
 * Funciones puras que validan si una transformación está permitida según la
 * política de la empresa: tipo, beneficios, planes, sucursales, horarios,
 * límites y métodos de fondeo.
 */

import type {
  TransformationType,
  TransformationPolicy,
  TransformationPolicyConfig,
} from './types'

export type PolicyDenyCode =
  | 'NO_POLICY'
  | 'POLICY_INACTIVE'
  | 'TYPE_NOT_ALLOWED'
  | 'SOURCE_BENEFIT_NOT_ALLOWED'
  | 'TARGET_BENEFIT_NOT_ALLOWED'
  | 'PLAN_NOT_ALLOWED'
  | 'BRANCH_NOT_ALLOWED'
  | 'OUTSIDE_SCHEDULE'
  | 'DAY_LIMIT_REACHED'
  | 'MONTH_LIMIT_REACHED'
  | 'MEMBERSHIP_LIMIT_REACHED'

export interface PolicyEvaluationContext {
  readonly type: TransformationType
  readonly sourceBenefitId: string
  readonly targetBenefitId?: string | null
  readonly planId?: string | null
  readonly sucursalId?: string | null
  readonly dayOfWeek?: string
  readonly hour?: number
  readonly transformationsToday?: number
  readonly transformationsThisMonth?: number
  readonly transformationsThisMembership?: number
}

export interface PolicyEvaluation {
  readonly allowed: boolean
  readonly policy: TransformationPolicy | null
  readonly denials: readonly PolicyDenyCode[]
  readonly requiresApproval: boolean
  readonly requiresPayment: boolean
  readonly pendingRules: readonly string[]
}

export function evaluatePolicy(
  policies: readonly TransformationPolicy[],
  ctx: PolicyEvaluationContext,
): PolicyEvaluation {
  const matching = policies
    .filter(p => p.type === ctx.type && p.active)
    .sort((a, b) => b.priority - a.priority)

  if (matching.length === 0) {
    return {
      allowed: false,
      policy: null,
      denials: ['NO_POLICY'],
      requiresApproval: false,
      requiresPayment: false,
      pendingRules: [],
    }
  }

  const policy = matching[0]
  const cfg = policy.config
  const denials: PolicyDenyCode[] = []

  if (cfg.allowedSourceBenefits?.length && !cfg.allowedSourceBenefits.includes(ctx.sourceBenefitId)) {
    denials.push('SOURCE_BENEFIT_NOT_ALLOWED')
  }

  if (ctx.targetBenefitId && cfg.allowedTargetBenefits?.length && !cfg.allowedTargetBenefits.includes(ctx.targetBenefitId)) {
    denials.push('TARGET_BENEFIT_NOT_ALLOWED')
  }

  if (ctx.planId && cfg.allowedPlans?.length && !cfg.allowedPlans.includes(ctx.planId)) {
    denials.push('PLAN_NOT_ALLOWED')
  }

  if (ctx.sucursalId && cfg.allowedBranches?.length && !cfg.allowedBranches.includes(ctx.sucursalId)) {
    denials.push('BRANCH_NOT_ALLOWED')
  }

  if (cfg.schedule) {
    const { allowedDays, allowedHoursFrom, allowedHoursTo } = cfg.schedule
    if (ctx.dayOfWeek && allowedDays?.length && !allowedDays.includes(ctx.dayOfWeek)) {
      denials.push('OUTSIDE_SCHEDULE')
    }
    if (ctx.hour != null) {
      const from = allowedHoursFrom ? parseInt(allowedHoursFrom, 10) : 0
      const to = allowedHoursTo ? parseInt(allowedHoursTo, 10) : 24
      if (ctx.hour < from || ctx.hour >= to) {
        denials.push('OUTSIDE_SCHEDULE')
      }
    }
  }

  if (cfg.limits) {
    const { maxPerDay, maxPerMonth, maxPerMembership } = cfg.limits
    if (maxPerDay != null && (ctx.transformationsToday ?? 0) >= maxPerDay) {
      denials.push('DAY_LIMIT_REACHED')
    }
    if (maxPerMonth != null && (ctx.transformationsThisMonth ?? 0) >= maxPerMonth) {
      denials.push('MONTH_LIMIT_REACHED')
    }
    if (maxPerMembership != null && (ctx.transformationsThisMembership ?? 0) >= maxPerMembership) {
      denials.push('MEMBERSHIP_LIMIT_REACHED')
    }
  }

  const pendingRules = cfg.customRules ? [...cfg.customRules] : []

  return {
    allowed: denials.length === 0,
    policy,
    denials,
    requiresApproval: cfg.requiresApproval ?? false,
    requiresPayment: cfg.requiresPayment ?? false,
    pendingRules,
  }
}

export function policyAllowsFunding(
  cfg: TransformationPolicyConfig | null | undefined,
): {
  payment: boolean
  points: boolean
  credits: boolean
  coupons: boolean
  promotions: boolean
  combined: boolean
} {
  const f = cfg?.funding
  return {
    payment: f?.allowPayment ?? true,
    points: f?.allowPoints ?? false,
    credits: f?.allowCredits ?? false,
    coupons: f?.allowCoupons ?? false,
    promotions: f?.allowPromotions ?? false,
    combined: f?.allowCombinedMethods ?? false,
  }
}
