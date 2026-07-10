/**
 * Taxonomía del Benefit Engine (Fase C): categorías de la biblioteca, tipos de
 * beneficio, módulos consumidores y segmentos estratégicos. Todo como DATOS
 * para que la UI y las plantillas los lean sin lógica embebida.
 */

import type { BenefitType } from './types'

/** Las 10 categorías de la Benefits & Rewards Library (Documento Maestro 3). */
export const BENEFIT_CATEGORIES = {
  SERVICE: 'servicios',
  DISCOUNT: 'descuentos',
  UPGRADE: 'upgrades',
  ECONOMIC: 'economicos',
  POINTS: 'puntos',
  MEMBERSHIP: 'membresia',
  VIP: 'vip',
  BEHAVIOR: 'comportamiento',
  REFERRAL: 'referidos',
  ADVANCED: 'avanzados',
} as const

export type BenefitCategoryKey =
  (typeof BENEFIT_CATEGORIES)[keyof typeof BENEFIT_CATEGORIES]

export interface BenefitCategoryDef {
  readonly id: BenefitCategoryKey
  readonly name: string
  readonly description: string
}

export const BENEFIT_CATEGORY_CATALOG: readonly BenefitCategoryDef[] = [
  { id: BENEFIT_CATEGORIES.SERVICE, name: 'Servicios', description: 'Servicios gratis (lavado, aspirado, cera, protección…).' },
  { id: BENEFIT_CATEGORIES.DISCOUNT, name: 'Descuentos', description: 'Porcentaje, monto fijo, exclusivo miembro, cumpleaños o recuperación.' },
  { id: BENEFIT_CATEGORIES.UPGRADE, name: 'Upgrades', description: 'Mejoras de servicio que aumentan el ticket.' },
  { id: BENEFIT_CATEGORIES.ECONOMIC, name: 'Económicos', description: 'Crédito interno, saldo promocional y cashback (wallet).' },
  { id: BENEFIT_CATEGORIES.POINTS, name: 'Puntos', description: 'Puntos extra, multiplicadores temporales y bonus inicial.' },
  { id: BENEFIT_CATEGORIES.MEMBERSHIP, name: 'Membresía', description: 'Visita adicional, mes gratis, precio congelado, prioridad.' },
  { id: BENEFIT_CATEGORIES.VIP, name: 'VIP', description: 'Línea rápida, área exclusiva, servicio personalizado, regalos.' },
  { id: BENEFIT_CATEGORIES.BEHAVIOR, name: 'Comportamiento', description: 'Premios por frecuencia, aniversario, recuperación, racha.' },
  { id: BENEFIT_CATEGORIES.REFERRAL, name: 'Referidos', description: 'Bonos por referido, escalonados, compartidos y de comunidad.' },
  { id: BENEFIT_CATEGORIES.ADVANCED, name: 'Avanzados', description: 'Oferta por IA, sorpresa, secreta, por predicción y por oportunidad.' },
]

export interface BenefitTypeDef {
  readonly id: BenefitType
  readonly name: string
  readonly description: string
}

/** Los 10 tipos base de beneficio y su descripción. */
export const BENEFIT_TYPE_CATALOG: readonly BenefitTypeDef[] = [
  { id: 'SERVICE_FREE', name: 'Servicio gratis', description: 'Un servicio sin costo para el cliente.' },
  { id: 'DISCOUNT', name: 'Descuento', description: 'Porcentaje o monto fijo de rebaja.' },
  { id: 'UPGRADE', name: 'Upgrade', description: 'Mejora de un servicio por otro superior.' },
  { id: 'PRODUCT', name: 'Producto', description: 'Un producto físico de regalo.' },
  { id: 'POINTS', name: 'Puntos', description: 'Puntos de lealtad (o multiplicador).' },
  { id: 'CREDIT', name: 'Crédito', description: 'Saldo interno utilizable (wallet).' },
  { id: 'TIME', name: 'Tiempo', description: 'Mes gratis, visita extra o precio congelado.' },
  { id: 'EXPERIENCE', name: 'Experiencia', description: 'Evento, servicio personalizado o experiencia.' },
  { id: 'ACCESS', name: 'Acceso', description: 'Acceso exclusivo (línea rápida, área VIP).' },
  { id: 'CUSTOM', name: 'Personalizado', description: 'Beneficio libre creado por la empresa.' },
]

/** Módulos que pueden entregar un beneficio (source del BenefitGrant). */
export const BENEFIT_MODULES = {
  MEMBERSHIP: 'membership',
  PROMOTION: 'promotion',
  REFERRAL: 'referral',
  POINTS: 'points',
  GAMIFICATION: 'gamification',
  CAMPAIGN: 'campaign',
  AUTOMATION: 'automation',
} as const

export type BenefitModuleKey =
  (typeof BENEFIT_MODULES)[keyof typeof BENEFIT_MODULES]

export const BENEFIT_MODULE_LIST: readonly BenefitModuleKey[] = Object.values(
  BENEFIT_MODULES,
)

/**
 * Segmentos estratégicos: guían qué beneficio conviene entregar a cada tipo de
 * cliente (Reglas estratégicas del documento). No todos se entregan igual.
 */
export const BENEFIT_SEGMENTS = {
  NEW: 'nuevo',
  FREQUENT: 'frecuente',
  VIP: 'vip',
  HIGH_VALUE: 'alto_valor',
  AT_RISK: 'en_riesgo',
  INACTIVE: 'inactivo',
  AMBASSADOR: 'embajador',
  ALL: 'todos',
} as const

export type BenefitSegmentKey =
  (typeof BENEFIT_SEGMENTS)[keyof typeof BENEFIT_SEGMENTS]
