/**
 * Tipos de dominio del Benefit Engine universal (Fase C).
 *
 * Un beneficio es una ENTIDAD independiente y editable, no "un descuento". Los
 * 50 beneficios de la Strategy Library (Car Wash) y cualquier beneficio que una
 * empresa cree se representan por DATOS, sin código por caso. Tipos puros, sin
 * Prisma. Todo lo específico (valor, servicio, reglas, disponibilidad) vive en
 * `BenefitConfig`.
 */

/** Los 10 tipos base de beneficio. Espeja `BenefitType` de Prisma. */
export type BenefitType =
  | 'SERVICE_FREE'
  | 'DISCOUNT'
  | 'UPGRADE'
  | 'PRODUCT'
  | 'POINTS'
  | 'CREDIT'
  | 'TIME'
  | 'EXPERIENCE'
  | 'ACCESS'
  | 'CUSTOM'

export type BenefitStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

/** Estado del beneficio entregado (ciclo de canje). Espeja Prisma. */
export type BenefitGrantStatus = 'GRANTED' | 'REDEEMED' | 'EXPIRED' | 'REVOKED'

/** Para DISCOUNT: si el valor es porcentaje o monto fijo. */
export type DiscountKind = 'PERCENT' | 'FIXED'

/** Unidad del beneficio TIME (mes gratis, visita extra, precio congelado…). */
export type TimeUnit = 'FREE_MONTH' | 'EXTRA_VISIT' | 'FROZEN_PRICE' | 'DAYS'

/**
 * Restricciones de uso de un beneficio (Reglas del Benefit Engine): a quién,
 * cuándo, con qué frecuencia y sobre qué servicios aplica.
 */
export interface BenefitRestrictions {
  /** Segmentos permitidos (ej. "gold", "vip", "nuevos"). Vacío = todos. */
  readonly segments?: readonly string[]
  /** Servicios sobre los que aplica (ej. "lavado_premium"). Vacío = todos. */
  readonly applicableServices?: readonly string[]
  /** Vigencia en días desde la entrega (ej. 30). */
  readonly validDays?: number
  /** Máximo de canjes por suscriptor en la ventana `perPeriod`. */
  readonly maxRedemptions?: number
  /** Ventana del límite de canjes. */
  readonly perPeriod?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'EVER'
  /** Requiere un plan/nivel mínimo (ej. "gold"). */
  readonly requiresTier?: string
  /** Expresiones BEL adicionales que deben cumplirse (F7). */
  readonly customRules?: readonly string[]
}

/** Disponibilidad temporal del beneficio (stock y ventana de fechas). */
export interface BenefitAvailability {
  /** Stock total disponible (null = ilimitado). */
  readonly stock?: number | null
  /** No disponible antes de esta fecha (ISO). */
  readonly availableFrom?: string | null
  /** No disponible después de esta fecha (ISO). */
  readonly availableUntil?: string | null
}

/**
 * Configuración flexible del beneficio. Aquí vive todo lo específico del tipo
 * sin columnas por caso: valor, servicio, producto, reglas, restricciones,
 * disponibilidad y los módulos donde puede utilizarse.
 */
export interface BenefitConfig {
  /** Valor numérico: % o monto (DISCOUNT), puntos (POINTS), monto (CREDIT)… */
  readonly value?: number
  /** Para DISCOUNT: porcentaje o monto fijo. */
  readonly discountKind?: DiscountKind
  /** Servicio objetivo (SERVICE_FREE/UPGRADE): ej. "lavado_premium". */
  readonly service?: string
  /** Para UPGRADE: servicio de origen (ej. "lavado_basico"). */
  readonly fromService?: string
  /** Para PRODUCT: nombre/sku del producto. */
  readonly product?: string
  /** Para TIME: unidad y cantidad. */
  readonly timeUnit?: TimeUnit
  /** Para POINTS: multiplicador temporal (ej. 2 = doble puntos). */
  readonly multiplier?: number
  /** Cantidad del beneficio (ej. 1 lavado, 2 visitas). */
  readonly quantity?: number
  readonly restrictions?: BenefitRestrictions
  readonly availability?: BenefitAvailability
  /** Módulos donde puede utilizarse (claves de BENEFIT_MODULES). */
  readonly modules?: readonly string[]
  /** Métricas a seguir (claves del catálogo de métricas). */
  readonly metrics?: readonly string[]
  readonly [extra: string]: unknown
}

/** Definición de un beneficio (plantilla instanciada o creado por la empresa). */
export interface Benefit {
  readonly id: string
  readonly companyId: string
  readonly code: string | null
  readonly name: string
  readonly description: string | null
  /** Categoría de la biblioteca (clave de BENEFIT_CATEGORIES). */
  readonly category: string
  readonly type: BenefitType
  /** Lo que el cliente CREE que vale (para valor percibido). */
  readonly perceivedValue: number | null
  /** Lo que le CUESTA al negocio (para rentabilidad/ROI). */
  readonly realCost: number | null
  readonly templateKey: string | null
  readonly config: BenefitConfig
  readonly status: BenefitStatus
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: Date
  readonly updatedAt: Date
}

/** Un beneficio entregado a un suscriptor desde un módulo. */
export interface BenefitGrant {
  readonly id: string
  readonly companyId: string
  readonly benefitId: string
  readonly subscriberId: string
  readonly subscriberKind: string
  /** Módulo que entregó el beneficio (clave de BENEFIT_MODULES). */
  readonly sourceModule: string
  readonly status: BenefitGrantStatus
  readonly grantedAt: Date
  readonly redeemedAt: Date | null
  readonly expiresAt: Date | null
  readonly meta: Readonly<Record<string, unknown>>
}
