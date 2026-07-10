/**
 * Arquitectura de decisiones inteligentes (Fase E1.10) — API pública y
 * composition root.
 *
 * Decision Engine → Recommendation Engine → Prediction → Optimization, servidos
 * por Decision Providers intercambiables. Etapa actual: un único proveedor
 * (Rule Based). El sistema queda PREPARADO para incorporar IA en el futuro
 * simplemente registrando un nuevo `DecisionProvider`, sin modificar los motores
 * existentes ni la experiencia de las empresas (que nunca ven "IA").
 *
 * Reglas de oro:
 *  - El Decision Engine DECIDE; nunca ejecuta acciones.
 *  - El Recommendation Engine PRODUCE recomendaciones; nunca las ejecuta.
 *  - La ejecución la hace SIEMPRE el Action Engine (vía automatizaciones).
 *
 * @example
 *   import { createDecisionSystem } from '@/lib/decision'
 *   const { engine, recommendations, prediction } = createDecisionSystem()
 *   const recs = await recommendations.recommend({
 *     kind: 'next_best_action',
 *     context: { subjectId: 'c1', facts: { 'cliente.compras': 0 } },
 *   })
 *   // `recs` describe qué debería ejecutar el Action Engine (no lo ejecuta aquí).
 */

import { DecisionProviderRegistry, type DecisionProvider } from './application/provider'
import { DecisionEngine, type DecisionEngineOptions } from './application/decision-engine'
import { RecommendationEngine } from './application/recommendation-engine'
import { PredictionFramework } from './application/prediction'
import { OptimizationEngine } from './application/optimization'
import { RuleBasedProvider } from './providers/rule-based-provider'

export interface DecisionSystem {
  readonly registry: DecisionProviderRegistry
  readonly engine: DecisionEngine
  readonly recommendations: RecommendationEngine
  readonly prediction: PredictionFramework
  readonly optimization: OptimizationEngine
}

export interface CreateDecisionSystemOptions extends DecisionEngineOptions {
  /** Proveedores adicionales (futuro: AI/ML/…). Se registran junto al Rule Based. */
  readonly providers?: readonly { provider: DecisionProvider; priority?: number }[]
  /** Omitir el Rule Based Provider por defecto (raro; solo para pruebas). */
  readonly withoutDefaultProvider?: boolean
}

/** Composition root: cablea el Rule Based Provider y los motores de decisión. */
export function createDecisionSystem(options: CreateDecisionSystemOptions = {}): DecisionSystem {
  const registry = new DecisionProviderRegistry()
  if (!options.withoutDefaultProvider) {
    registry.register(new RuleBasedProvider(), { priority: 0 })
  }
  for (const p of options.providers ?? []) {
    registry.register(p.provider, { priority: p.priority ?? 10 })
  }
  const engine = new DecisionEngine(registry, { strategy: options.strategy })
  const recommendations = new RecommendationEngine(engine)
  const prediction = new PredictionFramework(engine)
  const optimization = new OptimizationEngine()
  return { registry, engine, recommendations, prediction, optimization }
}

// ── Re-exports públicos ─────────────────────────────────────────────────────
export type {
  DecisionKind, EngineTarget, DecisionBand, DecisionContext, Candidate,
  DecisionThresholds, DecisionRequest, DecisionResult, Recommendation, StrategyOutcome,
} from './domain/types'
export { DECISION_KINDS } from './domain/types'
export { clamp01, num, bool, str, band, byScoreDesc } from './domain/scoring'
export { DecisionProviderRegistry } from './application/provider'
export type { DecisionProvider } from './application/provider'
export { DecisionEngine } from './application/decision-engine'
export type { DecisionEngineOptions } from './application/decision-engine'
export { RecommendationEngine } from './application/recommendation-engine'
export { PredictionFramework } from './application/prediction'
export type { PredictionOutput } from './application/prediction'
export { OptimizationEngine } from './application/optimization'
export type { OptimizationResult } from './application/optimization'
export { RuleBasedProvider, ENGINE_TARGETS } from './providers/rule-based-provider'
