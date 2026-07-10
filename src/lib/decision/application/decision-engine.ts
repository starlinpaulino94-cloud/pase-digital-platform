/**
 * Decision Engine (Fase E1.10). Enruta una solicitud a el/los proveedores que la
 * soportan y devuelve una decisión. NUNCA ejecuta acciones: solo decide. La
 * ejecución la realiza el Action Engine a través de las automatizaciones.
 *
 * Soporta múltiples proveedores activos: por defecto agrega los candidatos de
 * todos los proveedores compatibles (ensemble) y elige el mejor por score. Un
 * `providerHint` fuerza un proveedor concreto.
 */

import type { DecisionProviderRegistry } from './provider'
import type { Candidate, DecisionRequest, DecisionResult } from '../domain/types'
import { band, byScoreDesc } from '../domain/scoring'

export interface DecisionEngineOptions {
  /** Estrategia cuando hay varios proveedores: 'ensemble' (mezcla) o 'first'. */
  readonly strategy?: 'ensemble' | 'first'
}

export class DecisionEngine {
  constructor(
    private readonly registry: DecisionProviderRegistry,
    private readonly options: DecisionEngineOptions = {},
  ) {}

  async decide(request: DecisionRequest): Promise<DecisionResult> {
    const hint = request.options?.providerHint
    const providers = hint
      ? this.registry.list().filter((p) => p.kind === hint && p.supports(request.kind))
      : this.registry.forKind(request.kind)

    if (providers.length === 0) {
      return this.empty(request, 'sin_proveedor')
    }

    const strategy = this.options.strategy ?? 'ensemble'
    if (strategy === 'first') {
      for (const p of providers) {
        const r = await p.decide(request)
        if (r.decided) return r
      }
      return this.empty(request, providers.map((p) => p.kind).join('+'))
    }

    // ensemble: combina candidatos de todos los proveedores compatibles.
    const results = await Promise.all(providers.map((p) => p.decide(request)))
    return this.merge(request, results, providers.map((p) => p.kind).join('+'))
  }

  /** Fusiona resultados de varios proveedores: dedup por ref+id con score máx. */
  private merge(request: DecisionRequest, results: readonly DecisionResult[], provider: string): DecisionResult {
    const map = new Map<string, Candidate>()
    let anyDecided = false
    for (const r of results) {
      if (r.decided) anyDecided = true
      for (const c of r.candidates) {
        const key = `${c.ref}:${c.id}`
        const prev = map.get(key)
        if (!prev || (c.score ?? 0) > (prev.score ?? 0)) map.set(key, c)
      }
    }
    const limit = request.options?.limit ?? 5
    const ranked = byScoreDesc([...map.values()]).slice(0, limit)
    const best = ranked[0] ?? null
    const score = best?.score ?? 0
    return {
      kind: request.kind,
      provider,
      decided: anyDecided && ranked.length > 0,
      candidates: ranked,
      best,
      score,
      band: band(score, request.options?.thresholds),
      explanation: best?.reason ?? 'Sin candidatos con score suficiente.',
      at: request.context.now ?? new Date(),
    }
  }

  private empty(request: DecisionRequest, provider: string): DecisionResult {
    return {
      kind: request.kind,
      provider,
      decided: false,
      candidates: [],
      best: null,
      score: 0,
      band: 'low',
      explanation: 'No hay proveedor/datos para decidir.',
      at: request.context.now ?? new Date(),
    }
  }
}
