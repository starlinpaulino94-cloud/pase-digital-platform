/**
 * Optimization Engine (Fase E1.10). Compara resultados históricos de estrategias
 * e identifica la más efectiva para recomendar su reutilización. Puro y
 * determinista; no ejecuta nada — solo recomienda qué reutilizar.
 */

import type { StrategyOutcome } from '../domain/types'

export interface OptimizationResult {
  readonly winner: StrategyOutcome | null
  readonly ranked: readonly StrategyOutcome[]
  readonly explanation: string
}

export class OptimizationEngine {
  /**
   * Rankea estrategias por un score compuesto (ROI y conversión, penalizando
   * muestras pequeñas). Los pesos son configurables.
   */
  bestStrategy(
    outcomes: readonly StrategyOutcome[],
    weights: { readonly roi?: number; readonly conversion?: number; readonly minSamples?: number } = {},
  ): OptimizationResult {
    const wRoi = weights.roi ?? 0.6
    const wConv = weights.conversion ?? 0.4
    const minSamples = weights.minSamples ?? 0

    const eligible = outcomes.filter((o) => (o.samples ?? Infinity) >= minSamples)
    if (eligible.length === 0) {
      return { winner: null, ranked: [], explanation: 'Sin estrategias con muestra suficiente.' }
    }

    const score = (o: StrategyOutcome) => wRoi * o.roi + wConv * o.conversion
    const ranked = [...eligible].sort((a, b) => score(b) - score(a))
    const winner = ranked[0]
    return {
      winner,
      ranked,
      explanation: `Mejor estrategia: "${winner.strategy}" (ROI ${winner.roi}, conversión ${winner.conversion}).`,
    }
  }
}
