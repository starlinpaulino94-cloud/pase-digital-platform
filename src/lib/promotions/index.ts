/**
 * Framework Universal de Promociones (Fase 4) — API pública y composition root.
 *
 * Una promoción es una entidad CONFIGURABLE construida SOBRE el Rule Engine
 * (Fases 1-2) y el Action Engine (Fase 3): información administrativa + reglas
 * mapeadas + acciones mapeadas + restricciones + ciclo de vida + versionado +
 * auditoría. Cero lógica comercial y cero tipos de industria.
 *
 * Este archivo es lo único que el resto de la app debería importar.
 *
 * @example
 *   import { createPromotionService } from '@/lib/promotions'
 *   const promotions = createPromotionService()
 *   const promo = await promotions.create({ companyId, name: 'Base configurable' })
 *   await promotions.activate(promo.id, { userId })
 */

import { prisma } from '@/lib/prisma'
import { PromotionService } from './application/promotion-service'
import type { PromotionRepository } from './application/ports'
import { PrismaPromotionRepository } from './infrastructure/prisma-promotion-repository'

export interface CreatePromotionServiceOptions {
  /** Repositorio. Por defecto: Prisma sobre el cliente global. */
  repository?: PromotionRepository
}

/** Composition root del servicio de promociones. */
export function createPromotionService(
  options: CreatePromotionServiceOptions = {},
): PromotionService {
  const repository = options.repository ?? new PrismaPromotionRepository(prisma)
  return new PromotionService(repository)
}

// ── Re-exports públicos ─────────────────────────────────────────────────────
// Dominio
export type {
  Promotion,
  PromotionStatus,
  PromotionConfig,
  PromotionRuleRef,
  PromotionActionDef,
  PromotionRestrictionDef,
} from './domain/types'
export {
  PROMOTION_TRANSITIONS,
  isTerminal,
  canTransition,
  allowedTransitions,
  validateTransition,
} from './domain/lifecycle'
export {
  RESTRICTION_TYPES,
  RESTRICTION_CATALOG,
  getRestrictionDefinition,
  isCatalogRestriction,
} from './domain/restrictions'
export type {
  RestrictionScope,
  RestrictionWindow,
  RestrictionDefinition,
  RestrictionTypeKey,
} from './domain/restrictions'
export { computeChanges } from './domain/audit'
export type { PromotionAuditAction, PromotionAuditEntry } from './domain/audit'

// Aplicación
export {
  PromotionService,
  PromotionNotFoundError,
} from './application/promotion-service'
export type { PromotionResult, ActorRef } from './application/promotion-service'
export type {
  PromotionRepository,
  CreatePromotionData,
  UpdatePromotionData,
  ListPromotionsQuery,
  PromotionVersionSnapshot,
} from './application/ports'
export { PromotionEngine, toRuleAction } from './application/promotion-engine'
export type {
  PromotionEngineDeps,
  PromotionEvaluation,
} from './application/promotion-engine'

// Fase B — Promotion Strategy Library (plantillas por industria)
export {
  PROMOTION_OBJECTIVES, PROMOTION_SEGMENTS, BENEFIT_TYPES, TRIGGER_TYPES,
  PROMOTION_CHANNELS, PROMOTION_METRICS, DEFAULT_PROMOTION_METRICS,
} from './templates/taxonomy'
export type {
  PromotionObjective, PromotionSegment, BenefitType, TriggerType,
  PromotionChannel, PromotionMetric,
} from './templates/taxonomy'
export {
  instantiatePromotionTemplate, benefitToAction,
} from './templates/template-types'
export type {
  PromotionTemplate, BenefitSpec, TriggerSpec, TemplateRestriction,
  PromotionTemplateOverrides, InstantiatedPromotion,
} from './templates/template-types'
export {
  createPromotionFromTemplate, recommendTemplates, recommendByGoal,
  objectiveFromGoal,
} from './templates/service'
export { CARWASH_PROMOTION_TEMPLATES, getCarwashPromo } from './templates/carwash'

// Infraestructura
export { PrismaPromotionRepository } from './infrastructure/prisma-promotion-repository'
export { mapPromotion } from './infrastructure/mappers'
