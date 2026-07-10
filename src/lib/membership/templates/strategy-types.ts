/**
 * Estándar de estrategia de membresía (Fase F1.1).
 *
 * Una **estrategia** es un MODELO comercial documentado profesionalmente
 * (Unlimited, Créditos, Fleet…). No es un precio ni un plan: es el patrón
 * reutilizable. Cada estrategia genera **múltiples variantes** instaladas como
 * `MembershipTemplate` (que apuntan al Membership Engine). Este descriptor sigue
 * el estándar F0 y añade los 24 campos exigidos por F1.1.
 */

import type { MembershipPlanType } from '../domain/types'
import type {
  MembershipAudience,
  MembershipObjective,
  StrategyComplexity,
  EngineId,
} from './taxonomy'

export interface MembershipStrategy {
  /** Membership Strategy ID, ej. "carwash.membership.unlimited". */
  readonly id: string
  readonly industry: string
  /** Modelo comercial (espeja MembershipPlanType). */
  readonly model: MembershipPlanType
  readonly name: string
  readonly description: string

  // ── Taxonomía ──
  readonly objective: readonly MembershipObjective[]
  readonly audience: readonly MembershipAudience[]

  // ── Diagnóstico comercial ──
  readonly problemSolved: string
  readonly whenToUse: string
  readonly whenNotToUse: string
  readonly advantages: readonly string[]
  readonly disadvantages: readonly string[]
  readonly risks: readonly string[]
  readonly complexity: StrategyComplexity

  // ── Compatibilidades ──
  readonly compatibleServices: readonly string[]
  readonly compatibleVehicles: readonly string[]

  // ── Integración con motores ──
  readonly enginesUsed: readonly EngineId[]
  readonly automationPlaybooks: readonly string[]
  readonly compatibleBenefits: readonly string[]
  readonly compatiblePromotions: readonly string[]
  readonly compatibleCampaigns: readonly string[]
  readonly compatibleGamification: readonly string[]

  // ── Medición y operación ──
  readonly kpis: readonly string[]
  readonly bestPractices: readonly string[]
  readonly commonMistakes: readonly string[]

  // ── Variantes y versionado ──
  /** Claves de las `MembershipTemplate` que materializan esta estrategia. */
  readonly variantKeys: readonly string[]
  /** Versión semver de la estrategia (§7 del Documento Base). */
  readonly version: string
  readonly technicalNotes: string
}
