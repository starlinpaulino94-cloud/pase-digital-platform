/**
 * Tipos de dominio del Membership Engine universal (Fase A).
 *
 * Un plan de membresía es una entidad CONFIGURABLE: los 20 modelos comerciales
 * de la Strategy Library (Unlimited, Créditos, Tier, Family, Fleet, VIP…) se
 * representan por datos, sin código específico. Tipos puros, sin Prisma.
 */

/** Los 20 modelos comerciales. Espeja `MembershipPlanType` de Prisma. */
export type MembershipPlanType =
  | 'UNLIMITED'
  | 'CREDITS'
  | 'HYBRID'
  | 'TIER'
  | 'FAMILY'
  | 'FLEET'
  | 'CORPORATE'
  | 'SEASONAL'
  | 'PREMIUM'
  | 'MAINTENANCE'
  | 'PAY_PER_VISIT'
  | 'LOYALTY'
  | 'PREPAID'
  | 'VIP'
  | 'REWARDS'
  | 'TRIAL'
  | 'STUDENT'
  | 'DRIVER'
  | 'SUBSCRIPTION_BOX'
  | 'CUSTOM'

export type MembershipPeriodicity =
  | 'NONE'
  | 'ONE_TIME'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'ANNUAL'
  | 'SEASONAL'

export type MembershipPlanStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type MembershipInstanceStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'CANCELLED'

export type UsagePeriod = 'DAY' | 'WEEK' | 'MONTH'

/** Reglas de uso/límites de un plan (Usage Rules + Membership Rules). */
export interface MembershipLimits {
  /** Máximo de usos por período, ej. "1 lavado por día". */
  readonly maxPerPeriod?: { readonly count: number; readonly period: UsagePeriod }
  /** Tiempo mínimo entre usos (minutos). */
  readonly minIntervalMinutes?: number
  /** Máximo de vehículos registrados (Family/Fleet). */
  readonly maxVehicles?: number
  /** Servicios permitidos (vacío/undefined = todos los incluidos). */
  readonly allowedServices?: readonly string[]
  /** Créditos que pueden acumularse al renovar (0 = no acumulan). */
  readonly maxCreditsRollover?: number
  /** ¿Los créditos son transferibles entre suscriptores? */
  readonly creditsTransferable?: boolean
  /** Expresiones BEL adicionales que deben cumplirse para permitir el uso. */
  readonly customRules?: readonly string[]
}

/** Configuración de renovación. */
export interface MembershipRenewal {
  readonly auto?: boolean
  readonly graceDays?: number
  /** Prepago: meses adelantados y meses gratis (modelo Prepaid). */
  readonly prepaidMonths?: number
  readonly freeMonths?: number
}

export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

/** Ventana de disponibilidad del plan (días/horarios permitidos). */
export interface MembershipSchedule {
  /** Días en los que aplica (vacío/undefined = todos). */
  readonly allowedDays?: readonly WeekDay[]
  /** Franja horaria permitida, formato "HH:MM" 24h. */
  readonly allowedHours?: { readonly from: string; readonly to: string }
}

/**
 * Reglas de ciclo de vida configurables. Cada regla opcional puede llevar
 * expresiones BEL (`rules`) evaluadas por el Rule Engine; nada hardcodeado.
 */
export interface MembershipLifecycleRules {
  readonly upgrade?: { readonly allowed?: boolean; readonly rules?: readonly string[] }
  readonly downgrade?: { readonly allowed?: boolean; readonly rules?: readonly string[] }
  readonly suspension?: {
    readonly allowed?: boolean
    readonly maxDays?: number
    readonly rules?: readonly string[]
  }
  readonly cancellation?: {
    readonly allowed?: boolean
    /** Aviso previo requerido (días). */
    readonly noticeDays?: number
    /** Penalización por cancelación anticipada (monto o %, según config). */
    readonly penalty?: number
    readonly rules?: readonly string[]
  }
}

/**
 * Configuración flexible del plan. Aquí vive todo lo específico del modelo sin
 * columnas por caso: servicios incluidos, límites, beneficios, segmentos, etc.
 */
export interface MembershipConfig {
  readonly includedServices?: readonly string[]
  /** Servicios explícitamente excluidos (aunque estén incluidos por defecto). */
  readonly excludedServices?: readonly string[]
  readonly limits?: MembershipLimits
  /** Referencias a beneficios incluidos (Benefit Engine). */
  readonly benefits?: readonly string[]
  /** Beneficios opcionales que el cliente puede añadir (add-ons). */
  readonly optionalBenefits?: readonly string[]
  /** Recompensas asociadas (Reward Engine, pendiente). */
  readonly rewards?: readonly string[]
  /** Segmentos de cliente permitidos (ej. "estudiantes", "taxistas"). */
  readonly segments?: readonly string[]
  /** Tipos de vehículo admitidos (vacío = todos). */
  readonly vehicleTypes?: readonly string[]
  /** Sucursales donde aplica (ids; vacío/undefined = todas). */
  readonly branches?: readonly string[]
  /** Días/horarios permitidos. */
  readonly schedule?: MembershipSchedule
  readonly restrictions?: readonly string[]
  readonly renewal?: MembershipRenewal
  /** Reglas de upgrade/downgrade/suspensión/cancelación (BEL, Rule Engine). */
  readonly lifecycle?: MembershipLifecycleRules
  /** Métricas a seguir (claves del catálogo de métricas). */
  readonly metrics?: readonly string[]
  /** Automatizaciones asociadas (Automation Engine). */
  readonly automations?: readonly string[]
  /** Prioridad de resolución cuando varias membresías/plantillas compiten. */
  readonly priority?: number
  /** Variables custom por empresa (evaluables por BEL). */
  readonly variables?: Readonly<Record<string, unknown>>
  readonly [extra: string]: unknown
}

/** Definición de un plan de membresía (plantilla instanciada por empresa). */
export interface MembershipPlan {
  readonly id: string
  readonly companyId: string
  readonly name: string
  readonly description: string | null
  readonly type: MembershipPlanType
  readonly price: number
  readonly currency: string
  readonly periodicity: MembershipPeriodicity
  readonly durationDays: number | null
  readonly credits: number | null
  readonly unlimited: boolean
  readonly templateKey: string | null
  readonly config: MembershipConfig
  readonly status: MembershipPlanStatus
  readonly version: number
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: Date
  readonly updatedAt: Date
}

/** Vehículo registrado en una membresía Family/Fleet. */
export interface MembershipVehicle {
  readonly id: string
  readonly placa?: string
  readonly descripcion?: string
}

/** Membresía activa de un suscriptor. */
export interface MembershipInstance {
  readonly id: string
  readonly companyId: string
  readonly planId: string
  readonly subscriberId: string
  readonly subscriberKind: string
  readonly status: MembershipInstanceStatus
  readonly startsAt: Date | null
  readonly endsAt: Date | null
  readonly renewsAt: Date | null
  readonly autoRenew: boolean
  readonly creditsRemaining: number | null
  readonly vehicles: readonly MembershipVehicle[]
  readonly config: Readonly<Record<string, unknown>>
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: Date
  readonly updatedAt: Date
}

/** Un consumo registrado. */
export interface MembershipUsageRecord {
  readonly id: string
  readonly companyId: string
  readonly instanceId: string
  readonly service: string
  readonly quantity: number
  readonly vehicle: string | null
  readonly usedAt: Date
  readonly meta: Readonly<Record<string, unknown>>
}
