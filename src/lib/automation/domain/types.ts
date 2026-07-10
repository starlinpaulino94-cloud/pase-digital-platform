/**
 * Tipos de dominio del Automation Engine universal (Fase E1).
 *
 * Una automatización NUNCA contiene lógica fija: se compone de piezas
 * reutilizables — trigger + condiciones (Rule Engine) + acciones (Action
 * Engine) + esperas + variables + eventos —. Todo es configurable por empresa y
 * reutilizable por cualquier industria. Tipos puros, sin Prisma.
 */

export type AutomationStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED'

export type AutomationRunStatus =
  | 'RUNNING'
  | 'WAITING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SKIPPED'

/** Cómo se dispara una automatización (clave de AUTOMATION_TRIGGERS). */
export type AutomationTriggerType =
  | 'EVENT' // reacciona a un evento del bus (encadenado)
  | 'SCHEDULE' // por horario/cron
  | 'SEGMENT_ENTER' // el cliente entra a un segmento
  | 'DATE' // fecha del cliente (cumpleaños, aniversario…)
  | 'MANUAL' // ejecución manual desde el panel

/** Trigger + sus parámetros. */
export interface AutomationTrigger {
  readonly type: AutomationTriggerType
  /** Para EVENT: tipo de evento (ej. "cliente.visita"). */
  readonly event?: string
  /** Cron o expresión de horario (SCHEDULE). */
  readonly schedule?: string
  /** Segmento (SEGMENT_ENTER) o campo de fecha (DATE). */
  readonly params?: Readonly<Record<string, unknown>>
}

/** Una acción a enviar al Action Engine (nunca se ejecuta directamente). */
export interface AutomationActionSpec {
  /** Tipo del catálogo del Action Engine (ej. "apply_benefit"). */
  readonly type: string
  /** Parámetros con variables (ej. { points: '{{cliente.puntos}}' }). */
  readonly params?: Readonly<Record<string, unknown>>
  /** ¿Es obligatoria? Si falla y es obligatoria, corta el paso. */
  readonly required?: boolean
}

/** Una espera opcional entre pasos. */
export interface AutomationWait {
  /** Milisegundos a esperar. */
  readonly ms?: number
  /** Reanudar al recibir este evento (en lugar de por tiempo). */
  readonly untilEvent?: string
}

/**
 * Un paso de la automatización: condiciones (Rule Engine) → acciones (Action
 * Engine) → espera opcional. La secuencia de pasos permite el patrón del
 * documento: trigger → condiciones → acciones → espera → nuevas condiciones…
 */
export interface AutomationStep {
  readonly id?: string
  readonly label?: string
  /** Condición como expresión (BEL) evaluada por el Rule/Expression Engine. */
  readonly condition?: string | null
  readonly actions?: readonly AutomationActionSpec[]
  readonly wait?: AutomationWait
  /** Encadenado: automatización a disparar tras este paso (por templateKey/id). */
  readonly chain?: { readonly automationId?: string; readonly event?: string }
}

/** Restricciones de ejecución (editables por la empresa). */
export interface AutomationLimits {
  /** Máx. ejecuciones por sujeto en la ventana. */
  readonly maxPerSubject?: number
  readonly perPeriod?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'EVER'
  /** Máx. ejecuciones totales del programa. */
  readonly maxTotal?: number
}

/** Ventana horaria/días/fechas permitidas. */
export interface AutomationSchedule {
  /** Horas permitidas [inicio, fin] en formato "HH:mm". */
  readonly hours?: { readonly from: string; readonly to: string }
  /** Días permitidos (0=domingo … 6=sábado). */
  readonly days?: readonly number[]
  readonly startAt?: string | null
  readonly endAt?: string | null
}

/** Configuración completa de la automatización. */
export interface AutomationConfig {
  readonly trigger: AutomationTrigger
  readonly steps: readonly AutomationStep[]
  /** Variables usadas (claves del catálogo de variables). */
  readonly variables?: readonly string[]
  readonly limits?: AutomationLimits
  readonly schedule?: AutomationSchedule
  /** Canales de comunicación permitidos (email, push, sms, whatsapp). */
  readonly channels?: readonly string[]
  readonly priority?: number
  /** Métricas a seguir (claves del catálogo). */
  readonly metrics?: readonly string[]
  readonly [extra: string]: unknown
}

/** Definición de una automatización (plantilla instanciada o creada). */
export interface Automation {
  readonly id: string
  readonly companyId: string
  readonly name: string
  readonly description: string | null
  readonly objective: string | null
  readonly templateKey: string | null
  readonly trigger: AutomationTrigger
  readonly config: AutomationConfig
  readonly status: AutomationStatus
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: Date
  readonly updatedAt: Date
}

/** Regla evaluada durante un run (para auditoría). */
export interface EvaluatedRule {
  readonly expr: string
  readonly passed: boolean
  readonly detail?: unknown
}

/** Acción ejecutada durante un run (para auditoría). */
export interface ExecutedAction {
  readonly type: string
  readonly ok: boolean
  readonly detail?: unknown
}

/** Un evento del bus (lo consume otra automatización → encadenado). */
export interface AutomationEvent {
  readonly id: string
  readonly companyId: string
  readonly type: string
  readonly subjectId: string | null
  readonly subjectKind: string
  readonly payload: Readonly<Record<string, unknown>>
  readonly source: string | null
  readonly processed: boolean
  readonly occurredAt: Date
}

/** Registro de una ejecución (auditoría). */
export interface AutomationRun {
  readonly id: string
  readonly companyId: string
  readonly automationId: string
  readonly status: AutomationRunStatus
  readonly subjectId: string | null
  readonly subjectKind: string | null
  readonly triggeredBy: string | null
  readonly rulesEvaluated: readonly EvaluatedRule[]
  readonly actionsRun: readonly ExecutedAction[]
  readonly result: Readonly<Record<string, unknown>>
  readonly error: string | null
  readonly durationMs: number | null
  readonly startedAt: Date
  readonly finishedAt: Date | null
  readonly meta: Readonly<Record<string, unknown>>
}
