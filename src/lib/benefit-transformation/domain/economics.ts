/**
 * Cálculos económicos del Benefit Transformation Engine.
 *
 * Calcula la diferencia de valor entre beneficio origen y destino, aplica
 * impuestos y comisiones según la política, y determina el monto final.
 */

import type { TransformationPolicyConfig } from './types'

export interface ValuePair {
  readonly sourceValue: number
  readonly targetValue: number
}

export interface DifferenceResult {
  readonly grossDifference: number
  readonly tax: number
  readonly commission: number
  readonly totalDifference: number
}

const num = (v: number | null | undefined): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0

export function calculateDifference(
  values: ValuePair,
  policy?: TransformationPolicyConfig | null,
): DifferenceResult {
  const gross = num(values.targetValue) - num(values.sourceValue)
  const positiveGross = Math.max(0, gross)

  const taxRate = policy?.generatesTax ? num(policy.taxRate) : 0
  const commissionRate = policy?.generatesCommission ? num(policy.commissionRate) : 0

  const tax = positiveGross * (taxRate / 100)
  const commission = positiveGross * (commissionRate / 100)

  return {
    grossDifference: gross,
    tax: Math.round(tax * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    totalDifference: Math.round((positiveGross + tax + commission) * 100) / 100,
  }
}

export interface TransformationEconomics {
  readonly sourceValue: number
  readonly targetValue: number
  readonly grossDifference: number
  readonly tax: number
  readonly commission: number
  readonly totalDifference: number
  readonly totalCovered: number
  readonly remainingToPay: number
  readonly isUpgrade: boolean
  readonly isDowngrade: boolean
  readonly isEven: boolean
}

export function transformationEconomics(
  values: ValuePair,
  totalCovered: number,
  policy?: TransformationPolicyConfig | null,
): TransformationEconomics {
  const diff = calculateDifference(values, policy)
  const remaining = Math.max(0, diff.totalDifference - num(totalCovered))

  return {
    sourceValue: num(values.sourceValue),
    targetValue: num(values.targetValue),
    grossDifference: diff.grossDifference,
    tax: diff.tax,
    commission: diff.commission,
    totalDifference: diff.totalDifference,
    totalCovered: num(totalCovered),
    remainingToPay: Math.round(remaining * 100) / 100,
    isUpgrade: diff.grossDifference > 0,
    isDowngrade: diff.grossDifference < 0,
    isEven: diff.grossDifference === 0,
  }
}
