/**
 * Taxonomía de la Promotion Strategy Library (Fase B).
 *
 * Vocabulario universal de las promociones: objetivo comercial, segmento,
 * beneficio, trigger, canal y métrica. Son DATOS de clasificación; el motor
 * (Promotion Framework, F4) no los interpreta como código.
 */

/** Objetivo comercial de la promoción (la clasificación de 12). */
export const PROMOTION_OBJECTIVES = {
  CAPTURE: 'captacion',
  FIRST_PURCHASE: 'primera_compra',
  CONVERSION: 'conversion',
  FREQUENCY: 'frecuencia',
  RETENTION: 'retencion',
  RECOVERY: 'recuperacion',
  TICKET: 'ticket_promedio',
  PREMIUM: 'servicios_premium',
  MEMBERSHIP: 'membresias',
  SEASONAL: 'temporadas',
  REFERRAL: 'referidos',
  COMPETITIVE: 'competitivas',
} as const
export type PromotionObjective = (typeof PROMOTION_OBJECTIVES)[keyof typeof PROMOTION_OBJECTIVES]

/** Segmento de cliente al que se dirige. */
export const PROMOTION_SEGMENTS = {
  NEW: 'nuevo',
  FREQUENT: 'frecuente',
  VIP: 'vip',
  INACTIVE: 'inactivo',
  MEMBER: 'miembro',
  HIGH_VALUE: 'alto_valor',
  CONVERTED: 'convertido',
  ALL: 'todos',
} as const
export type PromotionSegment = (typeof PROMOTION_SEGMENTS)[keyof typeof PROMOTION_SEGMENTS]

/** Tipo de beneficio entregado. */
export const BENEFIT_TYPES = {
  PERCENTAGE: 'porcentaje',
  FIXED: 'valor_fijo',
  FREE_SERVICE: 'servicio_gratis',
  UPGRADE: 'upgrade',
  POINTS: 'puntos',
  CREDIT: 'credito',
} as const
export type BenefitType = (typeof BENEFIT_TYPES)[keyof typeof BENEFIT_TYPES]

/** Disparador de la promoción. */
export const TRIGGER_TYPES = {
  ON_SIGNUP: 'al_registrarse',
  ON_FIRST_VISIT: 'primera_visita',
  ON_VISIT_COUNT: 'cantidad_visitas',
  ON_INACTIVITY: 'inactividad',
  ON_DATE_RANGE: 'rango_fechas',
  ON_DAY_OF_WEEK: 'dia_semana',
  ON_WEATHER: 'clima',
  ON_MEMBERSHIP_EVENT: 'evento_membresia',
  ON_BEHAVIOR: 'comportamiento',
  MANUAL: 'manual',
  AI_RECOMMENDED: 'ia_recomendada',
} as const
export type TriggerType = (typeof TRIGGER_TYPES)[keyof typeof TRIGGER_TYPES]

/** Canal de difusión. */
export const PROMOTION_CHANNELS = {
  PUSH: 'push',
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  IN_APP: 'in_app',
  QR: 'qr',
} as const
export type PromotionChannel = (typeof PROMOTION_CHANNELS)[keyof typeof PROMOTION_CHANNELS]

/** Métricas obligatorias de toda promoción. */
export const PROMOTION_METRICS = {
  REACHED: 'clientes_alcanzados',
  CONVERTED: 'clientes_convertidos',
  USAGE: 'uso',
  SALES: 'ventas_generadas',
  BENEFIT_DELIVERED: 'beneficio_entregado',
  COST: 'costo',
  ROI: 'roi',
  PROFITABILITY: 'rentabilidad',
} as const
export type PromotionMetric = (typeof PROMOTION_METRICS)[keyof typeof PROMOTION_METRICS]

/** Métricas por defecto que toda promoción debería seguir. */
export const DEFAULT_PROMOTION_METRICS: readonly PromotionMetric[] = [
  PROMOTION_METRICS.REACHED,
  PROMOTION_METRICS.CONVERTED,
  PROMOTION_METRICS.USAGE,
  PROMOTION_METRICS.SALES,
  PROMOTION_METRICS.ROI,
]
