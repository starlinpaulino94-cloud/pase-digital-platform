/**
 * Catálogo de métricas del Automation Engine (Fase E1) — arquitectura para el
 * Analytics Engine. Declara como DATOS lo que cada automatización debe medir;
 * `automationRoi` computa el ROI a partir de ingresos y costo.
 */

export interface AutomationMetricDef {
  readonly id: string
  readonly name: string
  readonly description: string
}

export const AUTOMATION_METRICS = {
  EXECUTIONS: 'ejecuciones',
  CLIENTS_IMPACTED: 'clientes_impactados',
  CONVERSIONS: 'conversiones',
  BENEFITS_GRANTED: 'beneficios_entregados',
  BENEFITS_USED: 'beneficios_utilizados',
  REVENUE: 'ingresos_generados',
  ROI: 'roi',
  AVG_TIME: 'tiempo_promedio',
  ERRORS: 'errores',
  SUCCESS_RATE: 'tasa_de_exito',
} as const

export type AutomationMetricKey = (typeof AUTOMATION_METRICS)[keyof typeof AUTOMATION_METRICS]

export const AUTOMATION_METRIC_CATALOG: readonly AutomationMetricDef[] = [
  { id: AUTOMATION_METRICS.EXECUTIONS, name: 'Ejecuciones', description: 'Cantidad de veces que corrió la automatización.' },
  { id: AUTOMATION_METRICS.CLIENTS_IMPACTED, name: 'Clientes impactados', description: 'Sujetos distintos alcanzados.' },
  { id: AUTOMATION_METRICS.CONVERSIONS, name: 'Conversiones', description: 'Sujetos que realizaron la acción deseada.' },
  { id: AUTOMATION_METRICS.BENEFITS_GRANTED, name: 'Beneficios entregados', description: 'Beneficios otorgados por la automatización.' },
  { id: AUTOMATION_METRICS.BENEFITS_USED, name: 'Beneficios utilizados', description: 'Beneficios canjeados.' },
  { id: AUTOMATION_METRICS.REVENUE, name: 'Ingresos generados', description: 'Ingreso atribuible.' },
  { id: AUTOMATION_METRICS.ROI, name: 'ROI', description: 'Retorno de inversión.' },
  { id: AUTOMATION_METRICS.AVG_TIME, name: 'Tiempo promedio', description: 'Duración promedio de ejecución.' },
  { id: AUTOMATION_METRICS.ERRORS, name: 'Errores', description: 'Ejecuciones con error.' },
  { id: AUTOMATION_METRICS.SUCCESS_RATE, name: 'Tasa de éxito', description: 'Ejecuciones exitosas sobre el total.' },
]

/** Métricas por defecto de una automatización nueva. */
export const DEFAULT_AUTOMATION_METRICS: readonly AutomationMetricKey[] = [
  AUTOMATION_METRICS.EXECUTIONS,
  AUTOMATION_METRICS.CLIENTS_IMPACTED,
  AUTOMATION_METRICS.CONVERSIONS,
  AUTOMATION_METRICS.ROI,
]

export interface AutomationRoiInput {
  readonly revenueGenerated: number
  readonly cost: number
}

export interface AutomationRoiResult {
  readonly netValue: number
  readonly roi: number | null
}

/** ROI de la automatización: (ingresos − costo) / costo. Nunca lanza. */
export function automationRoi(input: AutomationRoiInput): AutomationRoiResult {
  const revenue = Number.isFinite(input.revenueGenerated) ? input.revenueGenerated : 0
  const cost = Number.isFinite(input.cost) ? input.cost : 0
  const netValue = revenue - cost
  return { netValue, roi: cost > 0 ? netValue / cost : null }
}
