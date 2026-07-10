/**
 * Recommendation Engine (Fase E1.10). Convierte una decisión del Decision Engine
 * en recomendaciones LISTAS para el Action Engine. Produce las recomendaciones;
 * NUNCA las ejecuta (eso es del Action Engine, vía las automatizaciones).
 */

import { ACTION_TYPES } from '@/lib/rule-engine'
import type { DecisionEngine } from './decision-engine'
import type { Candidate, DecisionKind, DecisionRequest, DecisionResult, EngineTarget, Recommendation } from '../domain/types'

/** Mapea (kind, candidato) a la acción del Action Engine que lo aplicaría. */
function actionFor(kind: DecisionKind, c: Candidate): { engine: EngineTarget; action: string; params: Record<string, unknown> } {
  switch (kind) {
    case 'recommend_benefit':
      return { engine: 'benefit', action: ACTION_TYPES.APPLY_BENEFIT, params: { benefitCode: c.id } }
    case 'recommend_promotion':
      return { engine: 'promotion', action: ACTION_TYPES.INVOKE_MODULE, params: { module: 'promotion', action: 'apply', code: c.id } }
    case 'recommend_membership':
      return { engine: 'membership', action: ACTION_TYPES.INVOKE_MODULE, params: { module: 'membership', action: 'recommend', plan: c.id } }
    case 'recommend_reward':
      return { engine: 'reward', action: ACTION_TYPES.ADD_POINTS, params: { rewardCode: c.id } }
    case 'recommend_campaign':
      return { engine: 'campaign', action: ACTION_TYPES.RUN_WORKFLOW, params: { workflow: c.id } }
    case 'detect_opportunity':
      return { engine: (c.ref ?? 'none'), action: ACTION_TYPES.RECORD_EVENT, params: { event: 'oportunidad.detectada', opportunity: c.id } }
    case 'predict_churn':
    case 'predict_renewal':
      return { engine: 'none', action: ACTION_TYPES.RECORD_EVENT, params: { event: `prediccion.${kind}`, score: c.score ?? 0 } }
    case 'optimize_strategy':
      return { engine: 'automation', action: ACTION_TYPES.RUN_WORKFLOW, params: { workflow: c.id } }
    case 'next_best_action':
    default:
      // La "mejor acción" ya viene descrita por el candidato (ref + id como acción).
      return { engine: c.ref, action: c.id, params: c.meta ?? {} }
  }
}

export class RecommendationEngine {
  constructor(private readonly engine: DecisionEngine) {}

  /** Decide y devuelve recomendaciones ordenadas (no ejecuta nada). */
  async recommend(request: DecisionRequest): Promise<Recommendation[]> {
    const result = await this.engine.decide(request)
    return this.fromResult(result)
  }

  /** Convierte un DecisionResult ya calculado en recomendaciones. */
  fromResult(result: DecisionResult): Recommendation[] {
    if (!result.decided) {
      // Sin decisión: la recomendación explícita es "esperar / no ejecutar".
      return [{ engine: 'none', action: 'wait', params: {}, priority: 0, reason: result.explanation, confidence: 0 }]
    }
    return result.candidates.map((c, i) => {
      const a = actionFor(result.kind, c)
      return {
        engine: a.engine,
        action: a.action,
        params: a.params,
        priority: result.candidates.length - i,
        reason: c.reason ?? result.explanation,
        confidence: c.score ?? result.score,
      }
    })
  }
}
