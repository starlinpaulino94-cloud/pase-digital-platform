/**
 * Estándar de estrategia promocional (Fase F1.2).
 *
 * Una **estrategia** es un objetivo comercial documentado (captación, upselling,
 * recuperación…), no un descuento. Genera **múltiples plantillas** instaladas
 * como `PromotionTemplate` (Promotion Framework). Sigue el estándar F0 y añade
 * los campos exigidos por F1.2.
 */

import type { PromotionSegment } from './taxonomy'
import type {
  PromotionStrategyCategory,
  PromotionComplexity,
  EngineId,
} from './strategy-taxonomy'

export interface PromotionStrategy {
  /** Promotion Strategy ID, ej. "carwash.promo.captacion". */
  readonly id: string
  readonly industry: string
  readonly category: PromotionStrategyCategory
  readonly name: string
  readonly description: string

  // ── Diagnóstico comercial ──
  readonly objective: string
  readonly problemSolved: string
  readonly expectedResult: string
  readonly whenToUse: string
  readonly whenNotToUse: string
  readonly recommendedSegment: readonly PromotionSegment[]

  // ── Compatibilidades ──
  readonly compatibleServices: readonly string[]
  readonly compatibleVehicles: readonly string[]
  readonly recommendedDuration: string
  readonly recommendedFrequency: string
  readonly complexity: PromotionComplexity

  // ── Integración con motores ──
  readonly enginesUsed: readonly EngineId[]
  readonly automationPlaybooks: readonly string[]
  readonly compatibleBenefits: readonly string[]
  readonly compatibleMemberships: readonly string[]
  readonly compatibleGamification: readonly string[]
  readonly compatibleCampaigns: readonly string[]

  // ── Medición y operación ──
  readonly kpis: readonly string[]
  readonly bestPractices: readonly string[]
  readonly commonMistakes: readonly string[]
  readonly risks: readonly string[]

  // ── Variantes y versionado ──
  /** Claves de las `PromotionTemplate` que materializan la estrategia. */
  readonly variantKeys: readonly string[]
  readonly version: string
  readonly technicalNotes: string
}
