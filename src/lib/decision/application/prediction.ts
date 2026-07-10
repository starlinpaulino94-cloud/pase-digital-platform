/**
 * Prediction Framework (Fase E1.10). Capa fina sobre el Decision Engine para
 * predicciones (abandono, renovación). Hoy las produce el Rule Based Provider con
 * reglas/umbrales; el día de mañana un AI/ML Provider las produce sin cambiar
 * esta interfaz ni los consumidores.
 */

import type { DecisionEngine } from './decision-engine'
import type { DecisionBand, DecisionContext, DecisionThresholds } from '../domain/types'

export interface PredictionOutput {
  readonly probability: number
  readonly band: DecisionBand
  readonly explanation: string
  readonly provider: string
}

export class PredictionFramework {
  constructor(private readonly engine: DecisionEngine) {}

  /** Probabilidad de abandono [0..1]. */
  async churnRisk(context: DecisionContext, thresholds?: DecisionThresholds): Promise<PredictionOutput> {
    const r = await this.engine.decide({ kind: 'predict_churn', context, options: { thresholds } })
    return { probability: r.score, band: r.band, explanation: r.explanation, provider: r.provider }
  }

  /** Probabilidad de renovación [0..1]. */
  async renewalLikelihood(context: DecisionContext, thresholds?: DecisionThresholds): Promise<PredictionOutput> {
    const r = await this.engine.decide({ kind: 'predict_renewal', context, options: { thresholds } })
    return { probability: r.score, band: r.band, explanation: r.explanation, provider: r.provider }
  }
}
