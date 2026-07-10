/**
 * Puertos del Automation Engine (Fase E1). El motor depende de estas
 * abstracciones, no de Prisma ni de los otros motores directamente:
 *
 * - `ConditionEvaluator`: decide condiciones — se cablea al Rule Engine / BEL
 *   (el Rule Engine es OBLIGATORIO; el motor no evalúa condiciones a mano).
 * - `ActionDispatcher`: ejecuta acciones — se cablea al Action Engine (todas
 *   las acciones pasan por él; el motor no ejecuta nada directamente).
 * - `VariableResolver`: arma el contexto de variables del sujeto.
 * - `EventStore`: persiste y publica eventos (encadenado entre automatizaciones).
 */

import type { VariableContext } from '../domain/variables'
import type {
  Automation,
  AutomationActionSpec,
  AutomationConfig,
  AutomationEvent,
  AutomationRun,
  AutomationRunStatus,
  AutomationStatus,
  AutomationTriggerType,
  EvaluatedRule,
  ExecutedAction,
} from '../domain/types'

// ── Rule Engine (condiciones) ────────────────────────────────────────────────
export interface ConditionEvaluator {
  /** Evalúa una expresión de condición contra el contexto de variables. */
  evaluate(expression: string, ctx: VariableContext): Promise<{ passed: boolean; detail?: unknown }>
}

// ── Action Engine (acciones) ─────────────────────────────────────────────────
export interface ActionDispatcher {
  /** Envía una acción al Action Engine con sus parámetros ya interpolados. */
  dispatch(
    action: AutomationActionSpec,
    ctx: { companyId: string; subjectId: string | null; variables: VariableContext },
  ): Promise<{ ok: boolean; detail?: unknown }>
}

// ── Variables ────────────────────────────────────────────────────────────────
export interface VariableResolver {
  resolve(input: {
    companyId: string
    subjectId: string | null
    trigger: Readonly<Record<string, unknown>>
  }): Promise<VariableContext>
}

// ── Eventos (bus / encadenado) ───────────────────────────────────────────────
export interface EventStore {
  emit(event: {
    companyId: string
    type: string
    subjectId: string | null
    subjectKind?: string
    payload?: Record<string, unknown>
    source?: string | null
  }): Promise<AutomationEvent>
  markProcessed(id: string): Promise<void>
}

// ── Repositorio ──────────────────────────────────────────────────────────────
export interface CreateAutomationData {
  readonly companyId: string
  readonly name: string
  readonly description?: string | null
  readonly objective?: string | null
  readonly templateKey?: string | null
  readonly triggerType: AutomationTriggerType
  readonly triggerEvent?: string | null
  readonly config: AutomationConfig
  readonly metadata?: Record<string, unknown>
}

export interface UpdateAutomationData {
  readonly name?: string
  readonly description?: string | null
  readonly objective?: string | null
  readonly config?: AutomationConfig
  readonly status?: AutomationStatus
  readonly metadata?: Record<string, unknown>
}

export interface AutomationRepository {
  createAutomation(data: CreateAutomationData): Promise<Automation>
  updateAutomation(id: string, data: UpdateAutomationData): Promise<Automation>
  findAutomation(id: string): Promise<Automation | null>
  listAutomations(
    companyId: string,
    filter?: { status?: AutomationStatus; triggerType?: AutomationTriggerType },
  ): Promise<Automation[]>
  /** Automatizaciones PUBLISHED disparadas por un tipo de evento (encadenado). */
  findByEvent(companyId: string, event: string): Promise<Automation[]>

  startRun(data: {
    companyId: string
    automationId: string
    subjectId: string | null
    subjectKind: string | null
    triggeredBy: string | null
  }): Promise<AutomationRun>
  finishRun(
    id: string,
    data: {
      status: AutomationRunStatus
      rulesEvaluated: EvaluatedRule[]
      actionsRun: ExecutedAction[]
      result: Record<string, unknown>
      error: string | null
      durationMs: number
    },
  ): Promise<AutomationRun>

  /** Ejecuciones de un sujeto desde `since` (para límites por sujeto). */
  countRunsForSubject(automationId: string, subjectId: string, since?: Date): Promise<number>
  /** Ejecuciones totales de una automatización (para maxTotal). */
  countRuns(automationId: string): Promise<number>
}

export type { AutomationConfig }
