/**
 * Rule Based Provider (Fase E1.10) — el ÚNICO proveedor de esta etapa. Decide
 * usando reglas, umbrales y scoring sobre los hechos del negocio (frecuencia,
 * gasto, historial, segmento, membresía…). Es determinista y sin dependencias
 * externas. En el futuro, un AI/ML Provider implementará el mismo puerto
 * `DecisionProvider` y podrá coexistir o sustituirlo sin tocar nada más.
 *
 * Nunca ejecuta acciones: solo produce un `DecisionResult`.
 */

import type { DecisionProvider } from '../application/provider'
import type { Candidate, DecisionKind, DecisionRequest, DecisionResult, EngineTarget } from '../domain/types'
import { band, byScoreDesc, clamp01, num, bool, str } from '../domain/scoring'

const RANKING_KINDS: readonly DecisionKind[] = [
  'recommend_promotion', 'recommend_membership', 'recommend_benefit',
  'recommend_campaign', 'recommend_reward',
]

export class RuleBasedProvider implements DecisionProvider {
  readonly kind = 'rule_based'

  supports(_kind: DecisionKind): boolean {
    return true // el proveedor de reglas soporta todos los tipos.
  }

  decide(request: DecisionRequest): DecisionResult {
    const { kind } = request
    if (RANKING_KINDS.includes(kind)) return this.rank(request)
    if (kind === 'predict_churn') return this.predictChurn(request)
    if (kind === 'predict_renewal') return this.predictRenewal(request)
    if (kind === 'detect_opportunity') return this.detectOpportunity(request)
    if (kind === 'next_best_action') return this.nextBestAction(request)
    // optimize_strategy se resuelve fuera (Optimization Engine); aquí neutral.
    return this.result(request, false, [], 'Tipo no manejado por reglas.')
  }

  // ── Ranking de candidatos (recommend_*) ────────────────────────────────────
  private rank(request: DecisionRequest): DecisionResult {
    const supplied = request.options?.candidates ?? []
    if (supplied.length === 0) {
      return this.result(request, false, [], 'No se suministraron candidatos a rankear.')
    }
    const facts = request.context.facts
    // Afinidad simple: respeta el score dado y lo ajusta por señales del contexto.
    const scored = supplied.map<Candidate>((c) => {
      let s = c.score ?? 0.5
      // Preferir opciones del segmento del cliente.
      const seg = str(facts, 'cliente.segmento')
      if (seg && String(c.meta?.segmento ?? '') === seg) s += 0.2
      // Penalizar opciones ya usadas recientemente.
      if (bool(facts, `usado.${c.id}`)) s -= 0.3
      return { ...c, score: clamp01(s) }
    })
    const limit = request.options?.limit ?? 5
    const ranked = byScoreDesc(scored).slice(0, limit)
    const best = ranked[0] ?? null
    return this.result(request, ranked.length > 0, ranked, best?.reason ?? 'Mejor opción por afinidad.', best?.score ?? 0)
  }

  // ── Predicción de abandono ──────────────────────────────────────────────────
  private predictChurn(request: DecisionRequest): DecisionResult {
    const f = request.context.facts
    const dias = num(f, 'cliente.diasSinActividad')
    const habitual = num(f, 'cliente.frecuenciaHabitual', 30)
    const rachaRota = bool(f, 'cliente.rachaRota')
    const gastoBaja = bool(f, 'cliente.gastoALaBaja')
    const beneficiosSinUsar = num(f, 'cliente.beneficiosSinUsar')
    // Score compuesto por reglas (todo configurable por umbrales).
    let s = 0
    if (habitual > 0) s += clamp01(dias / (habitual * 2)) * 0.6
    if (rachaRota) s += 0.2
    if (gastoBaja) s += 0.15
    if (beneficiosSinUsar > 0) s += 0.05
    s = clamp01(s)
    const cand: Candidate = { ref: 'none', id: 'churn', score: s, reason: `Riesgo por inactividad (${dias}d vs ${habitual}d habitual).` }
    return this.result(request, true, [cand], cand.reason!, s)
  }

  // ── Predicción de renovación ────────────────────────────────────────────────
  private predictRenewal(request: DecisionRequest): DecisionResult {
    const f = request.context.facts
    const uso = num(f, 'membresia.usosPeriodo')
    const esperado = num(f, 'membresia.usosEsperados', 1)
    const mesesActivo = num(f, 'membresia.mesesActivo')
    const autoRenov = bool(f, 'membresia.autoRenovacion')
    let s = 0.3
    if (esperado > 0) s += clamp01(uso / esperado) * 0.4
    if (mesesActivo >= 6) s += 0.15
    if (autoRenov) s += 0.15
    s = clamp01(s)
    const cand: Candidate = { ref: 'membership', id: 'renewal', score: s, reason: `Probabilidad de renovación por uso/permanencia.` }
    return this.result(request, true, [cand], cand.reason!, s)
  }

  // ── Detección de oportunidades ──────────────────────────────────────────────
  private detectOpportunity(request: DecisionRequest): DecisionResult {
    const f = request.context.facts
    const out: Candidate[] = []
    const ltv = num(f, 'cliente.ltv')
    const visitas = num(f, 'cliente.totalVisitas')
    const tieneMembresia = bool(f, 'cliente.tieneMembresia')
    const usoAlto = bool(f, 'cliente.usoAlto')
    if (ltv >= 500) out.push({ ref: 'membership', id: 'vip_potencial', score: 0.8, reason: 'Alto LTV: candidato a VIP.' })
    if (!tieneMembresia && visitas >= 4) out.push({ ref: 'membership', id: 'listo_membresia', score: 0.7, reason: 'Activo sin membresía: listo para plan.' })
    if (usoAlto && tieneMembresia) out.push({ ref: 'membership', id: 'listo_upgrade', score: 0.65, reason: 'Uso alto: candidato a upgrade.' })
    const ranked = byScoreDesc(out)
    return this.result(request, ranked.length > 0, ranked, ranked[0]?.reason ?? 'Sin oportunidades claras.', ranked[0]?.score ?? 0)
  }

  // ── Next Best Action (escalera de reglas) ───────────────────────────────────
  private nextBestAction(request: DecisionRequest): DecisionResult {
    const f = request.context.facts
    const churn = this.predictChurn(request).score
    const nearReward = bool(f, 'cliente.cercaDeRecompensa')
    const tieneMembresia = bool(f, 'cliente.tieneMembresia')
    const visitas = num(f, 'cliente.totalVisitas')
    const compras = num(f, 'cliente.compras')

    // Cada candidato describe (ref = motor, id = acción del Action Engine).
    const cand: Candidate[] = []
    if (churn >= 0.67) {
      cand.push({ ref: 'benefit', id: 'apply_benefit', score: churn, reason: 'Riesgo alto: entregar beneficio de retención.', meta: { benefitCode: 'CAR-011' } })
    } else if (compras === 0) {
      cand.push({ ref: 'benefit', id: 'apply_benefit', score: 0.6, reason: 'Sin primera compra: incentivar conversión.', meta: { benefitCode: 'CAR-004' } })
    } else if (nearReward) {
      cand.push({ ref: 'gamification', id: 'send_push', score: 0.55, reason: 'Cerca de recompensa: empujar (near-miss).', meta: { title: '¡Casi lo logras!' } })
    } else if (!tieneMembresia && visitas >= 4) {
      cand.push({ ref: 'membership', id: 'invoke_module', score: 0.5, reason: 'Activo sin membresía: recomendar plan.', meta: { module: 'membership', action: 'recommend' } })
    } else {
      cand.push({ ref: 'none', id: 'wait', score: 0.2, reason: 'Sin acción prioritaria: esperar.' })
    }
    const best = cand[0]
    return this.result(request, true, cand, best.reason!, best.score ?? 0)
  }

  // ── Helper de construcción de resultado ─────────────────────────────────────
  private result(
    request: DecisionRequest,
    decided: boolean,
    candidates: readonly Candidate[],
    explanation: string,
    score = 0,
  ): DecisionResult {
    const best = candidates[0] ?? null
    const s = best?.score ?? score
    return {
      kind: request.kind,
      provider: this.kind,
      decided,
      candidates,
      best,
      score: s,
      band: band(s, request.options?.thresholds),
      explanation,
      at: request.context.now ?? new Date(),
    }
  }
}

/** Objetivos de motor válidos (para validación externa si se requiere). */
export const ENGINE_TARGETS: readonly EngineTarget[] = [
  'promotion', 'membership', 'benefit', 'reward', 'referral',
  'campaign', 'gamification', 'automation', 'none',
]
