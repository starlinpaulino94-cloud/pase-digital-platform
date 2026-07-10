/**
 * Referral Engine universal (Fase D) — API pública y composition root.
 *
 * Motor de programas de recomendación 100% configurables para cualquier
 * industria. No premia solo por compartir un enlace: la recompensa depende del
 * VALOR generado (condiciones, estados, límites, antifraude). Reutiliza el
 * Benefit Engine (Fase C) para las recompensas — no duplica lógica. La
 * especificidad de industria vive en plantillas (`templates/`).
 *
 * @example
 *   import { createReferralService, CARWASH_REFERRAL_TEMPLATES, instantiateProgramTemplate } from '@/lib/referral'
 *   import { createBenefitService } from '@/lib/benefits'
 *   const referral = createReferralService({ benefits: createBenefitService() })
 *   const tpl = CARWASH_REFERRAL_TEMPLATES.find(t => t.name === 'Ambos ganan')!
 *   const program = await referral.createProgram(instantiateProgramTemplate(tpl, companyId))
 *   await referral.publishProgram(program.id)
 *   const p = await referral.enroll({ companyId, programId: program.id, referrerId: clienteId, code: 'JUAN10' })
 *   const r = await referral.registerReferral({ programId: program.id, participantId: p.id, referredId: nuevoId })
 *   if (r.ok) await referral.advance({ referralId: r.referral.id, to: 'FIRST_PURCHASE', facts: { purchases: 1, paymentConfirmed: true } })
 */

import { prisma } from '@/lib/prisma'
import { createBenefitService, type BenefitService } from '@/lib/benefits'
import { ReferralService, type RewardGranter } from './application/referral-service'
import { BenefitRewardGranter } from './application/benefit-reward-granter'
import type { ReferralRepository } from './application/ports'
import { PrismaReferralRepository } from './infrastructure/prisma-referral-repository'

export interface CreateReferralServiceOptions {
  repository?: ReferralRepository
  /** Concede recompensas vía Benefit Engine. Si se pasa `benefits`, se usa ese. */
  granter?: RewardGranter
  benefits?: BenefitService
}

/** Composition root del servicio de referidos. */
export function createReferralService(
  options: CreateReferralServiceOptions = {},
): ReferralService {
  const repo = options.repository ?? new PrismaReferralRepository(prisma)
  const granter =
    options.granter ??
    new BenefitRewardGranter(options.benefits ?? createBenefitService())
  return new ReferralService({ repo, granter })
}

// ── Re-exports públicos ─────────────────────────────────────────────────────
export type {
  ReferralModel, ReferralProgram, ReferralParticipant, ReferralReferral,
  ReferralConfig, ReferralReward, ReferralTier, ReferralCondition, ReferralLimits,
  ReferralFraudRules, ReferralLinkType, RewardTarget, ReferralProgramStatus,
  ReferralParticipantStatus, ReferralHistoryEntry,
} from './domain/types'

export {
  REFERRAL_MODEL_CATALOG, referralModel, REFERRAL_LINK_TYPES, REFERRAL_SEGMENTS,
} from './domain/models'
export type { ReferralModelDef, ReferralLinkTypeDef, ReferralSegmentKey } from './domain/models'

export {
  REFERRAL_STATES, REFERRAL_STATE_CATALOG, programFlow, rewardState,
  stateIndex, nextState, canAdvance, reachesReward,
} from './domain/states'
export type { ReferralStateKey, ReferralStateDef } from './domain/states'

export {
  REFERRAL_CONDITIONS, REFERRAL_CONDITION_CATALOG, evaluateConditions,
} from './domain/conditions'
export type { ReferralConditionKey, ReferralConditionDef, ReferralFacts, ConditionsResult } from './domain/conditions'

export { levelFor, currentTier, nextTier, applyEscalation } from './domain/escalation'
export type { EscalationResult } from './domain/escalation'

export { checkLimits } from './domain/limits'
export type { LimitContext, LimitResult, LimitDenyCode } from './domain/limits'

export { evaluateFraud, DEFAULT_FRAUD_RULES } from './domain/fraud'
export type { FraudSignals, FraudResult, FraudReasonCode } from './domain/fraud'

export {
  REFERRAL_METRICS, REFERRAL_METRIC_CATALOG, DEFAULT_REFERRAL_METRICS, referralRoi,
} from './domain/metrics'
export type { ReferralMetricKey, ReferralMetricDef, ReferralRoiResult } from './domain/metrics'

export { rewardGrantPlans } from './domain/rewards'
export type { RewardGrantPlan } from './domain/rewards'

export { ReferralService, ReferralError } from './application/referral-service'
export type {
  ReferralServiceDeps, RewardGranter, RegisterReferralInput, AdvanceInput, ReferralResult,
} from './application/referral-service'
export { BenefitRewardGranter } from './application/benefit-reward-granter'
export type {
  ReferralRepository, CreateProgramData, UpdateProgramData, EnrollData, CreateReferralData,
} from './application/ports'

export { instantiateProgramTemplate } from './templates/types'
export type { ReferralProgramTemplate, InstantiateProgramOverrides } from './templates/types'
export {
  CARWASH_REFERRAL_TEMPLATES, getCarwashReferralProgram, carwashReferralByCategory,
} from './templates/carwash'

export { PrismaReferralRepository } from './infrastructure/prisma-referral-repository'
export { mapProgram, mapParticipant, mapReferral } from './infrastructure/mappers'
