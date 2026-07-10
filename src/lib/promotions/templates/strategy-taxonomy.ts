/**
 * Taxonomía de la Promotion Strategy Library (Fase F1.2).
 *
 * Las promociones se organizan PRIMERO por objetivo de negocio (no por tipo de
 * descuento). Estas 15 categorías son el eje de la biblioteca. Datos de
 * clasificación; el Promotion Framework no las interpreta como código.
 */

/** Categoría de objetivo comercial (el eje de organización de F1.2). */
export const PROMOTION_STRATEGY_CATEGORIES = {
  CAPTURE: 'captacion',
  ACTIVATION: 'activacion',
  FREQUENCY: 'frecuencia',
  RETENTION: 'retencion',
  RECOVERY: 'recuperacion',
  TICKET: 'ticket_promedio',
  UPSELLING: 'upselling',
  CROSS_SELLING: 'cross_selling',
  MEMBERSHIP: 'membresias',
  REFERRAL: 'referidos',
  OFF_PEAK: 'horarios_baja_demanda',
  SEASONAL: 'temporadas',
  EVENTS: 'eventos',
  LOYALTY: 'fidelizacion',
  CELEBRATIONS: 'celebraciones',
} as const
export type PromotionStrategyCategory =
  (typeof PROMOTION_STRATEGY_CATEGORIES)[keyof typeof PROMOTION_STRATEGY_CATEGORIES]

/** Nivel de complejidad operativa de la estrategia. */
export type PromotionComplexity = 'baja' | 'media' | 'alta'

/** Motores del ecosistema (para declarar integración). */
export type EngineId =
  | 'rule'
  | 'action'
  | 'promotion'
  | 'membership'
  | 'benefit'
  | 'reward'
  | 'referral'
  | 'campaign'
  | 'automation'
  | 'gamification'
  | 'analytics'
  | 'decision'
  | 'template'

export interface StrategyCategoryEntry {
  readonly id: PromotionStrategyCategory
  readonly name: string
  readonly description: string
}

export const PROMOTION_STRATEGY_CATALOG: readonly StrategyCategoryEntry[] = [
  { id: 'captacion', name: 'Captación', description: 'Atraer nuevos clientes.' },
  { id: 'activacion', name: 'Activación', description: 'Convertir registros en primeras visitas.' },
  { id: 'frecuencia', name: 'Frecuencia', description: 'Aumentar la cantidad de visitas.' },
  { id: 'retencion', name: 'Retención', description: 'Mantener clientes activos.' },
  { id: 'recuperacion', name: 'Recuperación', description: 'Reactivar clientes inactivos.' },
  { id: 'ticket_promedio', name: 'Ticket promedio', description: 'Aumentar el valor de cada compra.' },
  { id: 'upselling', name: 'Upselling', description: 'Incentivar servicios de mayor valor.' },
  { id: 'cross_selling', name: 'Cross selling', description: 'Vender servicios complementarios.' },
  { id: 'membresias', name: 'Membresías', description: 'Vender o renovar membresías.' },
  { id: 'referidos', name: 'Referidos', description: 'Incentivar recomendaciones.' },
  { id: 'horarios_baja_demanda', name: 'Horarios de baja demanda', description: 'Redistribuir la demanda.' },
  { id: 'temporadas', name: 'Temporadas', description: 'Fechas especiales y temporadas.' },
  { id: 'eventos', name: 'Eventos', description: 'Eventos locales o comerciales.' },
  { id: 'fidelizacion', name: 'Fidelización', description: 'Clientes frecuentes o VIP.' },
  { id: 'celebraciones', name: 'Celebraciones', description: 'Cumpleaños, aniversarios e hitos.' },
]
