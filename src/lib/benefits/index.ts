/**
 * Benefit Engine universal (Fase C) — API pública y composition root.
 *
 * Una biblioteca universal de beneficios y recompensas que puede alimentar
 * membresías, promociones, referidos, puntos, gamificación, campañas y
 * automatizaciones. Un beneficio es una ENTIDAD independiente y editable, no
 * "un descuento": la empresa elige beneficios existentes, los modifica o crea
 * nuevos. La especificidad de industria vive en plantillas (`templates/`).
 *
 * @example
 *   import { createBenefitService, CARWASH_BENEFIT_TEMPLATES, instantiateBenefitTemplate } from '@/lib/benefits'
 *   const benefits = createBenefitService()
 *   const tpl = CARWASH_BENEFIT_TEMPLATES.find(t => t.code === 'CAR-001')!
 *   const benefit = await benefits.createBenefit(instantiateBenefitTemplate(tpl, companyId))
 *   await benefits.publishBenefit(benefit.id)
 *   const res = await benefits.grant({ companyId, benefitId: benefit.id, subscriberId: clienteId, sourceModule: 'referral' })
 */

import { prisma } from '@/lib/prisma'
import { BenefitService } from './application/benefit-service'
import type { BenefitRepository } from './application/ports'
import { PrismaBenefitRepository } from './infrastructure/prisma-benefit-repository'

export interface CreateBenefitServiceOptions {
  repository?: BenefitRepository
}

/** Composition root del servicio de beneficios. */
export function createBenefitService(
  options: CreateBenefitServiceOptions = {},
): BenefitService {
  const repository = options.repository ?? new PrismaBenefitRepository(prisma)
  return new BenefitService(repository)
}

// ── Re-exports públicos ─────────────────────────────────────────────────────
export type {
  Benefit, BenefitGrant, BenefitConfig, BenefitRestrictions, BenefitAvailability,
  BenefitType, BenefitStatus, BenefitGrantStatus, DiscountKind, TimeUnit,
} from './domain/types'

export {
  BENEFIT_CATEGORIES, BENEFIT_CATEGORY_CATALOG, BENEFIT_TYPE_CATALOG,
  BENEFIT_MODULES, BENEFIT_MODULE_LIST, BENEFIT_SEGMENTS,
} from './domain/taxonomy'
export type {
  BenefitCategoryKey, BenefitCategoryDef, BenefitTypeDef,
  BenefitModuleKey, BenefitSegmentKey,
} from './domain/taxonomy'

export { benefitEconomics, benefitRoi } from './domain/economics'
export type { BenefitEconomics, BenefitRoiInput, BenefitRoiResult } from './domain/economics'

export { BENEFIT_METRICS, BENEFIT_METRIC_CATALOG, DEFAULT_BENEFIT_METRICS } from './domain/metrics'
export type { BenefitMetricKey, BenefitMetricDef } from './domain/metrics'

export { checkEligibility, grantExpiry } from './domain/eligibility'
export type {
  EligibilityContext, EligibilityResult, EligibilityDenyCode,
} from './domain/eligibility'

export { benefitToActions } from './domain/benefit-to-action'
export type { BenefitActionSpec } from './domain/benefit-to-action'

export { BenefitService, BenefitError } from './application/benefit-service'
export type { GrantResult } from './application/benefit-service'
export { selectBenefitsForSegment } from './application/benefit-selector'
export type { BenefitRecommendation, SelectBenefitsOptions } from './application/benefit-selector'
export type {
  BenefitRepository, CreateBenefitData, UpdateBenefitData, GrantBenefitData,
} from './application/ports'

export { instantiateBenefitTemplate } from './templates/types'
export type { BenefitTemplate, InstantiateBenefitOverrides } from './templates/types'
export { CARWASH_BENEFIT_TEMPLATES, getCarwashBenefit } from './templates/carwash'
export { recommendedBenefits, allRecommended } from './templates/recommended'
export type { BenefitGoal } from './templates/recommended'

export { PrismaBenefitRepository } from './infrastructure/prisma-benefit-repository'
export { mapBenefit, mapGrant } from './infrastructure/mappers'
