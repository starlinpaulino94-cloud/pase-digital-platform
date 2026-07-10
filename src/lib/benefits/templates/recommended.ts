/**
 * Plantillas iniciales recomendadas para Car Wash (Fase C). Agrupa por OBJETIVO
 * los beneficios que el documento sugiere incluir de arranque, para que la
 * empresa despliegue un set coherente con un clic.
 */

import { CARWASH_BENEFIT_TEMPLATES } from './carwash'
import type { BenefitTemplate } from './types'

export type BenefitGoal =
  | 'captacion'
  | 'retencion'
  | 'membresias'
  | 'referidos'
  | 'recuperacion'

/** Códigos recomendados por objetivo (según el Documento Maestro 3). */
const RECOMMENDED_CODES: Record<BenefitGoal, readonly string[]> = {
  captacion: ['CAR-003', 'CAR-004', 'CAR-016'], // primer lavado/aroma + upgrade premium
  retencion: ['CAR-026', 'CAR-023', 'CAR-037'], // visita adicional, puntos extra, aniversario
  membresias: ['CAR-027', 'CAR-026', 'CAR-030'], // mes gratis, visita adicional, prioridad
  referidos: ['CAR-001', 'CAR-020', 'CAR-041'], // lavado gratis, crédito, bono referido
  recuperacion: ['CAR-015', 'CAR-005'], // descuento especial, servicio adicional
}

const BY_CODE = new Map(CARWASH_BENEFIT_TEMPLATES.map((t) => [t.code, t]))

/** Plantillas recomendadas para un objetivo. */
export function recommendedBenefits(goal: BenefitGoal): readonly BenefitTemplate[] {
  return (RECOMMENDED_CODES[goal] ?? [])
    .map((code) => BY_CODE.get(code))
    .filter((t): t is BenefitTemplate => t != null)
}

/** Todos los objetivos con sus plantillas (para la UI de arranque). */
export function allRecommended(): Record<BenefitGoal, readonly BenefitTemplate[]> {
  return {
    captacion: recommendedBenefits('captacion'),
    retencion: recommendedBenefits('retencion'),
    membresias: recommendedBenefits('membresias'),
    referidos: recommendedBenefits('referidos'),
    recuperacion: recommendedBenefits('recuperacion'),
  }
}
