/**
 * Selector estratégico de beneficios (Fase C). Materializa las Reglas
 * estratégicas del documento: "no todos los beneficios se entregan igual".
 * Dado un segmento (cliente nuevo, VIP, en riesgo…) recomienda los beneficios
 * más adecuados por categoría, ordenados por apalancamiento (valor/costo).
 *
 * La plataforma no piensa "crear un descuento", sino "seleccionar el beneficio
 * correcto para lograr el comportamiento correcto": Cliente + Segmento →
 * beneficio + momento.
 */

import { benefitEconomics } from '../domain/economics'
import { BENEFIT_CATEGORIES, BENEFIT_SEGMENTS, type BenefitSegmentKey } from '../domain/taxonomy'
import type { Benefit } from '../domain/types'

/**
 * Preferencia de categorías por segmento (orden = prioridad). Un cliente nuevo
 * recibe beneficios pequeños de captación; un VIP, exclusivos; uno en riesgo,
 * de recuperación.
 */
const SEGMENT_CATEGORY_PREFERENCE: Record<BenefitSegmentKey, readonly string[]> = {
  [BENEFIT_SEGMENTS.NEW]: [BENEFIT_CATEGORIES.SERVICE, BENEFIT_CATEGORIES.UPGRADE, BENEFIT_CATEGORIES.POINTS],
  [BENEFIT_SEGMENTS.FREQUENT]: [BENEFIT_CATEGORIES.BEHAVIOR, BENEFIT_CATEGORIES.POINTS, BENEFIT_CATEGORIES.SERVICE],
  [BENEFIT_SEGMENTS.VIP]: [BENEFIT_CATEGORIES.VIP, BENEFIT_CATEGORIES.MEMBERSHIP, BENEFIT_CATEGORIES.SERVICE],
  [BENEFIT_SEGMENTS.HIGH_VALUE]: [BENEFIT_CATEGORIES.VIP, BENEFIT_CATEGORIES.SERVICE, BENEFIT_CATEGORIES.ECONOMIC],
  [BENEFIT_SEGMENTS.AT_RISK]: [BENEFIT_CATEGORIES.DISCOUNT, BENEFIT_CATEGORIES.ECONOMIC, BENEFIT_CATEGORIES.SERVICE],
  [BENEFIT_SEGMENTS.INACTIVE]: [BENEFIT_CATEGORIES.DISCOUNT, BENEFIT_CATEGORIES.SERVICE, BENEFIT_CATEGORIES.ECONOMIC],
  [BENEFIT_SEGMENTS.AMBASSADOR]: [BENEFIT_CATEGORIES.REFERRAL, BENEFIT_CATEGORIES.SERVICE, BENEFIT_CATEGORIES.ECONOMIC],
  [BENEFIT_SEGMENTS.ALL]: [BENEFIT_CATEGORIES.SERVICE, BENEFIT_CATEGORIES.DISCOUNT, BENEFIT_CATEGORIES.POINTS],
}

export interface BenefitRecommendation {
  readonly benefit: Benefit
  /** Puntaje 0..1: qué tan adecuado es para el segmento. */
  readonly score: number
  readonly reason: string
}

export interface SelectBenefitsOptions {
  /** Máximo de recomendaciones (default 5). */
  readonly limit?: number
  /** Presupuesto máximo de costo real por beneficio (opcional). */
  readonly maxRealCost?: number
}

/**
 * Recomienda beneficios para un segmento a partir de un catálogo ya cargado
 * (típicamente los PUBLISHED de la empresa). Puro y determinista.
 */
export function selectBenefitsForSegment(
  segment: BenefitSegmentKey,
  catalog: readonly Benefit[],
  options: SelectBenefitsOptions = {},
): readonly BenefitRecommendation[] {
  const limit = options.limit ?? 5
  const preference = SEGMENT_CATEGORY_PREFERENCE[segment] ?? SEGMENT_CATEGORY_PREFERENCE[BENEFIT_SEGMENTS.ALL]

  const candidates = catalog.filter((b) => {
    if (b.status !== 'PUBLISHED') return false
    if (options.maxRealCost != null && (b.realCost ?? 0) > options.maxRealCost) return false
    // Si el beneficio restringe segmentos, debe incluir el buscado (o "todos").
    const segs = b.config.restrictions?.segments
    if (segs && segs.length > 0 && !segs.includes(segment) && !segs.includes(BENEFIT_SEGMENTS.ALL)) {
      return false
    }
    return true
  })

  const scored = candidates.map((benefit) => {
    const rank = preference.indexOf(benefit.category)
    // Ajuste por categoría preferida (peso 0.6) + apalancamiento (peso 0.4).
    const categoryScore = rank === -1 ? 0 : 1 - rank / Math.max(1, preference.length)
    const lev = benefitEconomics(benefit).leverage
    const leverageScore = lev == null ? 0.3 : Math.min(1, lev / 6)
    const score = Number((0.6 * categoryScore + 0.4 * leverageScore).toFixed(4))
    return {
      benefit,
      score,
      reason:
        rank !== -1
          ? `Encaja con el segmento "${segment}" (categoría ${benefit.category}).`
          : `Alternativa por buen apalancamiento valor/costo.`,
    }
  })

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
