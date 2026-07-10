/**
 * Tipos de dominio del Framework Universal de Promociones (Fase 4).
 *
 * Una promoción es una entidad CONFIGURABLE: información administrativa +
 * reglas (Rule Engine) + acciones (Action Engine) + restricciones + ciclo de
 * vida + configuración flexible. NO contiene lógica de negocio ni tipos de
 * industria: todo se representa como datos. Tipos puros, sin Prisma.
 */

/** Estados del ciclo de vida. Espeja el enum `PromotionStatus` de Prisma. */
export type PromotionStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'ENDED'
  | 'ARCHIVED'
  | 'CANCELLED'

/**
 * Configuración flexible: bolsa de parámetros arbitrarios. NUNCA se modelan
 * como columnas fijas, para soportar cientos de casos y futuras industrias sin
 * rediseñar la base de datos.
 */
export type PromotionConfig = Readonly<Record<string, unknown>>

/** Referencia a una regla del Rule Engine reutilizada por la promoción. */
export interface PromotionRuleRef {
  readonly id: string
  readonly ruleId: string
  readonly order: number
}

/** Acción de la promoción, configurada por datos (se ejecuta vía Action Engine). */
export interface PromotionActionDef {
  readonly id: string
  readonly type: string
  readonly params: Readonly<Record<string, unknown>>
  readonly order: number
  readonly required: boolean
  readonly maxRetries: number
  readonly enabled: boolean
  readonly version: number
}

/** Restricción universal (config; sin validación implementada todavía). */
export interface PromotionRestrictionDef {
  readonly id: string
  readonly type: string
  readonly value: number | null
  readonly config: Readonly<Record<string, unknown>>
  readonly enabled: boolean
}

/** Definición completa de una promoción (agregado de dominio). */
export interface Promotion {
  readonly id: string
  readonly companyId: string
  readonly name: string
  readonly description: string | null
  /** Etiqueta libre de organización (NUNCA un tipo de industria). */
  readonly category: string | null
  readonly status: PromotionStatus
  /** Mayor = más prioritaria ante conflictos entre promociones. */
  readonly priority: number
  readonly startsAt: Date | null
  readonly endsAt: Date | null
  readonly config: PromotionConfig
  readonly metadata: Readonly<Record<string, unknown>>
  readonly version: number
  readonly createdById: string | null
  readonly updatedById: string | null
  readonly rules: readonly PromotionRuleRef[]
  readonly actions: readonly PromotionActionDef[]
  readonly restrictions: readonly PromotionRestrictionDef[]
  readonly createdAt: Date
  readonly updatedAt: Date
}
