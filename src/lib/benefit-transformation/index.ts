/**
 * Benefit Transformation Engine — Composition Root (Fase E1.7).
 *
 * Motor universal de transformación de beneficios: upgrade, downgrade,
 * exchange, replacement, customization, split y merge. Cualquier industria,
 * configurable por empresa, extensible sin tocar el núcleo.
 *
 * @example
 *   import { createTransformationService } from '@/lib/benefit-transformation'
 *   const svc = createTransformationService()
 *   const result = await svc.request({ ... })
 */

import { prisma } from '@/lib/prisma'
import { PrismaTransformationRepository } from './infrastructure/prisma-transformation-repository'
import { TransformationService } from './application/transformation-service'
import { ResolutionEngine } from './application/resolution-engine'

// ── Domain ─────────────────────────────────────────────────────────────────
export type {
  TransformationType,
  TransformationStatus,
  TransformationRecord,
  TransformationResult,
  TransformationRequest,
  TransformationPolicy,
  TransformationPolicyConfig,
  TransformationPolicySchedule,
  TransformationPolicyLimits,
  TransformationPolicyFunding,
  ResolutionSourceType,
  ResolutionItem,
  ResolutionResult,
  TransformationAuditAction,
  TransformationAuditEntry,
} from './domain/types'

export {
  TRANSFORMATION_TYPES,
  TRANSFORMATION_STATUSES,
  TERMINAL_STATUSES,
  RESOLUTION_SOURCE_TYPES,
} from './domain/types'

export {
  TRANSFORMATION_TRANSITIONS,
  validateTransition,
  isTerminal,
  canCancel,
} from './domain/lifecycle'

export {
  calculateDifference,
  transformationEconomics,
} from './domain/economics'
export type { ValuePair, DifferenceResult, TransformationEconomics } from './domain/economics'

export { evaluatePolicy, policyAllowsFunding } from './domain/policy'
export type { PolicyDenyCode, PolicyEvaluationContext, PolicyEvaluation } from './domain/policy'

export {
  DEFAULT_RESOLUTION_ORDER,
  buildResolution,
  runResolutionPipeline,
} from './domain/resolution'
export type { ResolutionContext, ResolutionSourceProvider } from './domain/resolution'

// ── Application ────────────────────────────────────────────────────────────
export { TransformationService } from './application/transformation-service'
export type { TransformationServiceDeps } from './application/transformation-service'
export { ResolutionEngine } from './application/resolution-engine'
export type { ResolutionEngineOptions } from './application/resolution-engine'
export type {
  TransformationRepository,
  CreateTransformationData,
  UpdateTransformationData,
  CreatePolicyData,
  UpdatePolicyData,
} from './application/ports'

// ── Infrastructure ─────────────────────────────────────────────────────────
export { PrismaTransformationRepository } from './infrastructure/prisma-transformation-repository'

// ── Templates ──────────────────────────────────────────────────────────────
export type { TransformationPolicyTemplate } from './templates/types'
export {
  CARWASH_TRANSFORMATION_TEMPLATES,
  getCarwashTransformationTemplate,
  listCarwashTransformationTemplates,
} from './templates/carwash'

// ── Factory ────────────────────────────────────────────────────────────────

export interface CreateTransformationServiceOptions {
  readonly repo?: PrismaTransformationRepository
  readonly resolutionEngine?: ResolutionEngine
}

export function createTransformationService(
  options?: CreateTransformationServiceOptions,
): TransformationService {
  const repo = options?.repo ?? new PrismaTransformationRepository(prisma)
  const resolutionEngine = options?.resolutionEngine ?? new ResolutionEngine()

  return new TransformationService({ repo, resolutionEngine })
}
