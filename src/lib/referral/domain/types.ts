/**
 * Tipos de dominio del Referral Engine universal (Fase D).
 *
 * Un programa de referidos es una ENTIDAD configurable: los 10 modelos del
 * Documento Maestro 4 (clásico, ambos ganan, progresivo, embajador, influencer,
 * corporativo, empleados, equipos…) se representan por DATOS, sin código por
 * caso. Tipos puros, sin Prisma. Reutiliza el Benefit Engine (Fase C) para las
 * recompensas: aquí solo se REFERENCIAN beneficios, no se re-implementan.
 */

/** Los 10 modelos de programa. Espeja `ReferralModel` de Prisma. */
export type ReferralModel =
  | 'CLASSIC'
  | 'REFERRER_ONLY'
  | 'REFERRED_ONLY'
  | 'BOTH'
  | 'PROGRESSIVE'
  | 'AMBASSADOR'
  | 'INFLUENCER'
  | 'CORPORATE'
  | 'EMPLOYEE'
  | 'TEAM'

export type ReferralProgramStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type ReferralParticipantStatus = 'ACTIVE' | 'PAUSED' | 'BLOCKED'

/** Métodos de compartir habilitables por programa. */
export type ReferralLinkType = 'CODE' | 'QR' | 'LINK' | 'MANUAL'

/** A quién se le entrega la recompensa. */
export type RewardTarget = 'REFERRER' | 'REFERRED' | 'BOTH'

/**
 * Una recompensa referencia un beneficio del Benefit Engine (por `code` o
 * `benefitId`) y a quién se entrega. El Referral Engine no define beneficios.
 */
export interface ReferralReward {
  /** A quién: quien invita, el nuevo cliente, o ambos. */
  readonly target: RewardTarget
  /** Código de plantilla de beneficio (ej. "CAR-001") o id de un Benefit. */
  readonly benefitCode?: string
  readonly benefitId?: string
  /** Etiqueta legible (fallback si no hay beneficio ligado). */
  readonly label?: string
}

/** Un peldaño del escalado progresivo (Modelo 5). */
export interface ReferralTier {
  /** Referidos convertidos necesarios (ej. 1, 3, 5, 10…). */
  readonly threshold: number
  readonly reward: ReferralReward
  /** Nombre del nivel (ej. "Silver", "Embajador oficial"). */
  readonly label?: string
}

/** Condición que un referido debe cumplir para liberar la recompensa. */
export interface ReferralCondition {
  /** Clave del catálogo de condiciones (ej. "first_purchase"). */
  readonly type: string
  /** Valor asociado (ej. monto mínimo, número de compras, días). */
  readonly value?: number
}

/** Límites configurables del programa. */
export interface ReferralLimits {
  readonly maxPerDay?: number
  readonly maxPerWeek?: number
  readonly maxPerMonth?: number
  /** Máximo de recompensas liberadas (global del programa). */
  readonly maxRewards?: number
  /** Presupuesto máximo (suma de costo real de recompensas). */
  readonly maxBudget?: number
  /** Fecha de expiración del programa (ISO). */
  readonly expiresAt?: string | null
}

/** Reglas antifraude, cada una activable/desactivable por la empresa. */
export interface ReferralFraudRules {
  readonly blockSelfReferral?: boolean
  readonly blockDuplicateEmail?: boolean
  readonly blockDuplicatePhone?: boolean
  readonly blockRepeatedDevice?: boolean
  readonly blockMultipleAccounts?: boolean
  /** Máx. registros desde una misma huella de IP en la ventana. */
  readonly maxPerIp?: number
  /** Exigir compra real para liberar la recompensa. */
  readonly requireRealPurchase?: boolean
}

/**
 * Configuración completa del programa. Aquí vive toda la estrategia sin
 * columnas por caso.
 */
export interface ReferralConfig {
  /** Flujo de estados del referido (orden). Vacío = flujo canónico por defecto. */
  readonly states?: readonly string[]
  /** Estado en el que se libera la recompensa (ej. "FIRST_PURCHASE"). */
  readonly rewardState?: string
  /** Recompensas base (modelos no progresivos). */
  readonly rewards?: readonly ReferralReward[]
  /** Peldaños del escalado (Modelo 5, progresivo). */
  readonly tiers?: readonly ReferralTier[]
  /** Condiciones que el referido debe cumplir. */
  readonly conditions?: readonly ReferralCondition[]
  readonly limits?: ReferralLimits
  readonly fraud?: ReferralFraudRules
  /** Métodos de compartir habilitados. */
  readonly linkTypes?: readonly ReferralLinkType[]
  /** Segmentos a los que aplica el programa. */
  readonly segments?: readonly string[]
  /** Métricas a seguir (claves del catálogo de KPIs). */
  readonly metrics?: readonly string[]
  readonly [extra: string]: unknown
}

/** Definición de un programa de referidos (plantilla instanciada o creado). */
export interface ReferralProgram {
  readonly id: string
  readonly companyId: string
  readonly name: string
  readonly objective: string | null
  readonly type: ReferralModel
  readonly templateKey: string | null
  readonly config: ReferralConfig
  readonly status: ReferralProgramStatus
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: Date
  readonly updatedAt: Date
}

/** Un participante (quien invita) inscrito en un programa. */
export interface ReferralParticipant {
  readonly id: string
  readonly companyId: string
  readonly programId: string
  readonly referrerId: string
  readonly referrerKind: string
  readonly code: string
  readonly status: ReferralParticipantStatus
  readonly level: number
  readonly referralsCount: number
  readonly convertedCount: number
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: Date
  readonly updatedAt: Date
}

/** Un paso del recorrido de estados de un referido. */
export interface ReferralHistoryEntry {
  readonly state: string
  readonly at: string
}

/** Un referido concreto y su estado dentro del flujo. */
export interface ReferralReferral {
  readonly id: string
  readonly companyId: string
  readonly programId: string
  readonly participantId: string
  readonly referredId: string | null
  readonly referredKind: string
  readonly state: string
  readonly history: readonly ReferralHistoryEntry[]
  readonly suspicious: boolean
  readonly fraudReasons: readonly string[]
  readonly rewardReleased: boolean
  readonly rewardGrantId: string | null
  readonly invitedAt: Date
  readonly meta: Readonly<Record<string, unknown>>
}
