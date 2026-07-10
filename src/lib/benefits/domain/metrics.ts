/**
 * Catálogo de métricas del Benefit Engine (Fase C) — arquitectura para el
 * Analytics Engine (pendiente). Declara como DATOS lo que debe medirse; el
 * cálculo real llega con el motor de analítica. Los helpers de `economics.ts`
 * ya permiten computar costo real, valor y ROI a partir de los grants.
 */

export interface BenefitMetricDef {
  readonly id: string
  readonly name: string
  readonly description: string
}

export const BENEFIT_METRICS = {
  GRANTED: 'beneficios_entregados',
  REDEEMED: 'beneficios_utilizados',
  REAL_COST: 'costo_real',
  VALUE_GENERATED: 'valor_generado',
  CONVERSION: 'conversion',
  RETENTION: 'retencion',
  ROI: 'roi',
} as const

export type BenefitMetricKey = (typeof BENEFIT_METRICS)[keyof typeof BENEFIT_METRICS]

export const BENEFIT_METRIC_CATALOG: readonly BenefitMetricDef[] = [
  { id: BENEFIT_METRICS.GRANTED, name: 'Beneficios entregados', description: 'Cuántos beneficios se entregaron en el período.' },
  { id: BENEFIT_METRICS.REDEEMED, name: 'Beneficios utilizados', description: 'Cuántos beneficios entregados fueron canjeados.' },
  { id: BENEFIT_METRICS.REAL_COST, name: 'Costo real', description: 'Costo para el negocio de los beneficios utilizados.' },
  { id: BENEFIT_METRICS.VALUE_GENERATED, name: 'Valor generado', description: 'Ingreso atribuible a los beneficios canjeados.' },
  { id: BENEFIT_METRICS.CONVERSION, name: 'Conversión', description: 'Porcentaje de beneficios que derivan en la acción deseada.' },
  { id: BENEFIT_METRICS.RETENTION, name: 'Retención', description: 'Efecto del beneficio en la retención de clientes.' },
  { id: BENEFIT_METRICS.ROI, name: 'ROI', description: 'Retorno de inversión del beneficio (valor − costo / costo).' },
]

/** Métricas por defecto que sigue un beneficio nuevo. */
export const DEFAULT_BENEFIT_METRICS: readonly BenefitMetricKey[] = [
  BENEFIT_METRICS.GRANTED,
  BENEFIT_METRICS.REDEEMED,
  BENEFIT_METRICS.ROI,
]
