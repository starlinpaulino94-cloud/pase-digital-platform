/**
 * Arquitectura de decisiones inteligentes (Fase E1.10) — dominio puro.
 *
 * No es un "AI Engine". Es una arquitectura DESACOPLADA de proveedores:
 * Decision Engine → Recommendation Engine → Prediction → Optimization, servida
 * por Decision Providers intercambiables. Hoy existe un único proveedor
 * (Rule Based); mañana se pueden añadir AI/ML/Statistical/Custom sin tocar el
 * resto del sistema. Las empresas nunca ven "IA": solo funcionalidades
 * inteligentes.
 *
 * Regla de oro: el Decision Engine DECIDE, nunca EJECUTA. La ejecución la hace
 * siempre el Action Engine (a través de las automatizaciones/playbooks).
 */

/** Tipo de decisión solicitada. */
export type DecisionKind =
  | 'recommend_promotion'
  | 'recommend_membership'
  | 'recommend_benefit'
  | 'recommend_campaign'
  | 'recommend_reward'
  | 'predict_churn'
  | 'predict_renewal'
  | 'detect_opportunity'
  | 'optimize_strategy'
  | 'next_best_action'

export const DECISION_KINDS: readonly DecisionKind[] = [
  'recommend_promotion', 'recommend_membership', 'recommend_benefit',
  'recommend_campaign', 'recommend_reward', 'predict_churn', 'predict_renewal',
  'detect_opportunity', 'optimize_strategy', 'next_best_action',
]

/** Motor destino de una recomendación (o `none`/`wait` = no ejecutar). */
export type EngineTarget =
  | 'promotion'
  | 'membership'
  | 'benefit'
  | 'reward'
  | 'referral'
  | 'campaign'
  | 'gamification'
  | 'automation'
  | 'none'

/** Banda cualitativa de un score/probabilidad. */
export type DecisionBand = 'low' | 'medium' | 'high'

/** Contexto de la decisión: hechos del negocio (cliente.*, membresia.*, …). */
export interface DecisionContext {
  readonly subjectId: string
  /** Hechos disponibles (frecuencia, gasto, historial, segmento, membresía…). */
  readonly facts: Readonly<Record<string, unknown>>
  readonly now?: Date
}

/** Una opción candidata a recomendar (beneficio, plan, campaña…). */
export interface Candidate {
  /** Motor al que pertenece la opción. */
  readonly ref: EngineTarget
  /** Código/ID de la opción (ej. "CAR-004", id de plan). */
  readonly id: string
  /** Puntuación [0..1] asignada por el proveedor. */
  readonly score?: number
  /** Explicación legible de por qué se propone. */
  readonly reason?: string
  readonly meta?: Readonly<Record<string, unknown>>
}

/** Umbrales configurables (por empresa) para bandas y reglas. */
export interface DecisionThresholds {
  readonly low?: number
  readonly high?: number
  readonly [key: string]: number | undefined
}

/** Solicitud de decisión. */
export interface DecisionRequest {
  readonly kind: DecisionKind
  readonly context: DecisionContext
  readonly options?: {
    /** Opciones pre-suministradas a rankear (si aplica). */
    readonly candidates?: readonly Candidate[]
    /** Umbrales editables por la empresa. */
    readonly thresholds?: DecisionThresholds
    /** Forzar un proveedor concreto por su `kind` (ej. "rule_based"). */
    readonly providerHint?: string
    /** Máximo de candidatos a devolver. */
    readonly limit?: number
  }
}

/** Resultado de una decisión (NO contiene acciones ejecutadas). */
export interface DecisionResult {
  readonly kind: DecisionKind
  /** Proveedor(es) que produjeron el resultado. */
  readonly provider: string
  /** ¿Se pudo decidir? (false = sin datos/candidatos suficientes). */
  readonly decided: boolean
  /** Candidatos ordenados por score (mejor primero). */
  readonly candidates: readonly Candidate[]
  /** Mejor candidato (o null). */
  readonly best: Candidate | null
  /** Score/probabilidad del mejor candidato/decisión [0..1]. */
  readonly score: number
  readonly band: DecisionBand
  readonly explanation: string
  readonly at: Date
}

/**
 * Recomendación lista para que el Action Engine la ejecute. El Recommendation
 * Engine la PRODUCE; nunca la ejecuta.
 */
export interface Recommendation {
  readonly engine: EngineTarget
  /** Acción del catálogo del Action Engine (ej. "apply_benefit") o "wait". */
  readonly action: string
  readonly params: Readonly<Record<string, unknown>>
  readonly priority: number
  readonly reason: string
  readonly confidence: number
}

/** Resultado histórico de una estrategia (para el Optimization Engine). */
export interface StrategyOutcome {
  readonly strategy: string
  readonly roi: number
  readonly conversion: number
  readonly cost?: number
  readonly samples?: number
}
