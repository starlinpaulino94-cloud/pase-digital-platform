/**
 * Catálogo de KPIs del Referral Engine (Fase D) — arquitectura para el
 * Analytics Engine (pendiente). Declara como DATOS lo que el panel debe mostrar;
 * el cálculo real llega con el motor de analítica. `referralRoi` ya permite
 * computar el ROI del programa a partir de ingresos y costo.
 */

export interface ReferralMetricDef {
  readonly id: string
  readonly name: string
  readonly description: string
}

export const REFERRAL_METRICS = {
  INVITES: 'invitaciones_enviadas',
  REGISTRATIONS: 'registros_obtenidos',
  FIRST_PURCHASES: 'primeras_compras',
  CONVERSION: 'conversion',
  ACTIVE_REFERRALS: 'referidos_activos',
  REVENUE: 'ingresos_generados',
  REWARDS_GIVEN: 'recompensas_entregadas',
  PROGRAM_COST: 'costo_del_programa',
  ROI: 'roi',
  TOP_INFLUENCERS: 'clientes_mayor_influencia',
  AMBASSADOR_RANKING: 'ranking_embajadores',
  FRAUD_RATE: 'tasa_de_fraude',
  AVG_REFERRAL_VALUE: 'valor_promedio_referido',
  REFERRED_LTV: 'ltv_referidos',
  REFERRED_VS_NOT: 'referidos_vs_no_referidos',
} as const

export type ReferralMetricKey = (typeof REFERRAL_METRICS)[keyof typeof REFERRAL_METRICS]

export const REFERRAL_METRIC_CATALOG: readonly ReferralMetricDef[] = [
  { id: REFERRAL_METRICS.INVITES, name: 'Invitaciones enviadas', description: 'Enlaces compartidos por los participantes.' },
  { id: REFERRAL_METRICS.REGISTRATIONS, name: 'Registros obtenidos', description: 'Referidos que crearon cuenta.' },
  { id: REFERRAL_METRICS.FIRST_PURCHASES, name: 'Primeras compras', description: 'Referidos que compraron por primera vez.' },
  { id: REFERRAL_METRICS.CONVERSION, name: 'Conversión', description: 'Registros o compras sobre invitaciones.' },
  { id: REFERRAL_METRICS.ACTIVE_REFERRALS, name: 'Referidos activos', description: 'Referidos que siguen activos.' },
  { id: REFERRAL_METRICS.REVENUE, name: 'Ingresos generados', description: 'Ingreso atribuible a los referidos.' },
  { id: REFERRAL_METRICS.REWARDS_GIVEN, name: 'Recompensas entregadas', description: 'Beneficios liberados por el programa.' },
  { id: REFERRAL_METRICS.PROGRAM_COST, name: 'Costo del programa', description: 'Costo real de las recompensas entregadas.' },
  { id: REFERRAL_METRICS.ROI, name: 'ROI', description: 'Retorno de inversión del programa.' },
  { id: REFERRAL_METRICS.TOP_INFLUENCERS, name: 'Mayor influencia', description: 'Participantes que más convierten.' },
  { id: REFERRAL_METRICS.AMBASSADOR_RANKING, name: 'Ranking de embajadores', description: 'Clasificación de embajadores por desempeño.' },
  { id: REFERRAL_METRICS.FRAUD_RATE, name: 'Tasa de fraude', description: 'Referidos marcados sospechosos sobre el total.' },
  { id: REFERRAL_METRICS.AVG_REFERRAL_VALUE, name: 'Valor promedio', description: 'Valor promedio de un referido.' },
  { id: REFERRAL_METRICS.REFERRED_LTV, name: 'LTV referidos', description: 'Valor de vida de los clientes referidos.' },
  { id: REFERRAL_METRICS.REFERRED_VS_NOT, name: 'Referidos vs no referidos', description: 'Comparación de comportamiento.' },
]

/** Métricas por defecto de un programa nuevo. */
export const DEFAULT_REFERRAL_METRICS: readonly ReferralMetricKey[] = [
  REFERRAL_METRICS.INVITES,
  REFERRAL_METRICS.REGISTRATIONS,
  REFERRAL_METRICS.CONVERSION,
  REFERRAL_METRICS.ROI,
]

export interface ReferralRoiInput {
  readonly revenueGenerated: number
  readonly programCost: number
}

export interface ReferralRoiResult {
  readonly netValue: number
  readonly roi: number | null
}

/** ROI del programa: (ingresos − costo) / costo. Nunca lanza. */
export function referralRoi(input: ReferralRoiInput): ReferralRoiResult {
  const revenue = Number.isFinite(input.revenueGenerated) ? input.revenueGenerated : 0
  const cost = Number.isFinite(input.programCost) ? input.programCost : 0
  const netValue = revenue - cost
  return { netValue, roi: cost > 0 ? netValue / cost : null }
}
