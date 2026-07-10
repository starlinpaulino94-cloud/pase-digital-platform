/**
 * Catálogo de métricas de membresía (Fase A) — arquitectura para el Analytics
 * Engine (pendiente). Declara como DATOS las métricas clave que un plan puede
 * seguir; el cálculo real llegará con el motor de analítica.
 */

export interface MembershipMetricDef {
  readonly id: string
  readonly name: string
  readonly description: string
}

export const MEMBERSHIP_METRICS = {
  AVG_USAGE: 'uso_promedio',
  PROFIT_PER_MEMBER: 'rentabilidad_por_miembro',
  AVG_VISITS: 'visitas_promedio',
  CANCELLATIONS: 'cancelaciones',
  RETENTION: 'retencion',
  CHURN: 'churn',
  LTV: 'ltv',
  RENEWAL_RATE: 'tasa_renovacion',
} as const

export type MembershipMetricKey = (typeof MEMBERSHIP_METRICS)[keyof typeof MEMBERSHIP_METRICS]

export const MEMBERSHIP_METRIC_CATALOG: readonly MembershipMetricDef[] = [
  { id: MEMBERSHIP_METRICS.AVG_USAGE, name: 'Uso promedio', description: 'Usos promedio por miembro en el período.' },
  { id: MEMBERSHIP_METRICS.PROFIT_PER_MEMBER, name: 'Rentabilidad por miembro', description: 'Ingreso menos costo por miembro.' },
  { id: MEMBERSHIP_METRICS.AVG_VISITS, name: 'Visitas promedio', description: 'Visitas promedio por miembro.' },
  { id: MEMBERSHIP_METRICS.CANCELLATIONS, name: 'Cancelaciones', description: 'Membresías canceladas en el período.' },
  { id: MEMBERSHIP_METRICS.RETENTION, name: 'Retención', description: 'Porcentaje de miembros que renuevan.' },
  { id: MEMBERSHIP_METRICS.CHURN, name: 'Churn', description: 'Porcentaje de bajas.' },
  { id: MEMBERSHIP_METRICS.LTV, name: 'LTV', description: 'Valor de vida del miembro.' },
  { id: MEMBERSHIP_METRICS.RENEWAL_RATE, name: 'Tasa de renovación', description: 'Renovaciones sobre vencimientos.' },
]
