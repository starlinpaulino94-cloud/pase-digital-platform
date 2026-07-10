/**
 * Economía del beneficio (Fase C). Distingue el VALOR PERCIBIDO (lo que el
 * cliente cree que vale) del COSTO REAL (lo que le cuesta al negocio) para
 * poder medir rentabilidad y ROI.
 *
 * Ejemplo del documento — Lavado gratis:
 *   valor percibido: RD$800 · costo real: RD$150 → apalancamiento 5.33x.
 */

import type { Benefit } from './types'

export interface BenefitEconomics {
  /** Valor percibido por el cliente. */
  readonly perceivedValue: number
  /** Costo real para el negocio. */
  readonly realCost: number
  /** Diferencia percibido − real (valor "regalado" en percepción). */
  readonly perceptionGap: number
  /** Cuántas veces el valor percibido supera al costo (percibido / costo). */
  readonly leverage: number | null
}

const num = (v: number | null | undefined): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0

/** Economía base de un beneficio a partir de sus valores percibido/real. */
export function benefitEconomics(benefit: Benefit): BenefitEconomics {
  const perceivedValue = num(benefit.perceivedValue)
  const realCost = num(benefit.realCost)
  return {
    perceivedValue,
    realCost,
    perceptionGap: perceivedValue - realCost,
    leverage: realCost > 0 ? perceivedValue / realCost : null,
  }
}

export interface BenefitRoiInput {
  /** Beneficios entregados. */
  readonly granted: number
  /** Beneficios efectivamente utilizados (canjeados). */
  readonly redeemed: number
  /** Costo real unitario del beneficio. */
  readonly realCost: number
  /** Ingreso atribuible generado por los canjes (ventas, renovaciones…). */
  readonly revenueGenerated: number
}

export interface BenefitRoiResult {
  readonly granted: number
  readonly redeemed: number
  /** Canjeados / entregados. */
  readonly redemptionRate: number
  /** Costo real total (solo se costea lo utilizado). */
  readonly totalCost: number
  /** Ingreso − costo. */
  readonly netValue: number
  /** (Ingreso − costo) / costo. null si costo = 0. */
  readonly roi: number | null
}

/**
 * ROI del beneficio: el costo se imputa solo a lo UTILIZADO (un lavado gratis
 * entregado pero no canjeado no cuesta materia prima). Nunca lanza.
 */
export function benefitRoi(input: BenefitRoiInput): BenefitRoiResult {
  const granted = Math.max(0, Math.floor(num(input.granted)))
  const redeemed = Math.max(0, Math.floor(num(input.redeemed)))
  const unitCost = num(input.realCost)
  const revenue = num(input.revenueGenerated)

  const totalCost = redeemed * unitCost
  const netValue = revenue - totalCost
  return {
    granted,
    redeemed,
    redemptionRate: granted > 0 ? redeemed / granted : 0,
    totalCost,
    netValue,
    roi: totalCost > 0 ? netValue / totalCost : null,
  }
}
