/**
 * Contrato y registro de ACCIONES (Action Handlers).
 *
 * Fase 1 dejó el esqueleto; Fase 3 lo convierte en el Motor Universal de
 * Acciones. Cada acción de negocio se implementa como un ActionHandler
 * independiente (un módulo) y se registra en el ActionRegistry. El motor nunca
 * conoce acciones concretas: pide ejecutar por `type` (Open/Closed + DIP).
 *
 * IMPORTANTE (Fase 3): SOLO arquitectura. No se registra ningún handler real.
 * El ActionExecutor tratará toda acción como `NO_HANDLER`.
 */

import type { ActionContext } from './action-context'
import { getActionDefinition } from './action-catalog'
import type { ActionResult } from './action-result'
import { DuplicateRegistrationError } from './errors'
import type { Rule, RuleAction } from './types'

/** Todo lo que un handler necesita para ejecutar (o revertir) una acción. */
export interface ActionExecutionInput {
  readonly rule: Rule
  readonly action: RuleAction
  readonly context: ActionContext
}

/**
 * Puerto que implementará cada acción de negocio. `execute` realiza el efecto;
 * `rollback` (opcional) lo deshace —base de la arquitectura de compensación—.
 */
export interface ActionHandler {
  /** Clave que enlaza con RuleAction.type y con el catálogo. */
  readonly type: string
  /** ¿El handler sabe compensar/revertir su efecto? */
  readonly supportsRollback?: boolean
  execute(input: ActionExecutionInput): Promise<ActionResult> | ActionResult
  /** Compensación de un efecto ya aplicado (si `supportsRollback`). */
  rollback?(input: ActionExecutionInput, result: ActionResult): Promise<void> | void
}

/**
 * Registro extensible de handlers. En Fase 3 se instancia VACÍO. Opcionalmente
 * valida que el `type` pertenezca al catálogo universal (permitiendo también
 * tipos custom fuera de catálogo).
 */
export class ActionRegistry {
  private readonly handlers = new Map<string, ActionHandler>()

  /**
   * Registra un handler.
   * @param opts.requireCatalog si true, exige que el type esté en el catálogo.
   */
  register(handler: ActionHandler, opts: { requireCatalog?: boolean } = {}): this {
    if (this.handlers.has(handler.type)) {
      throw new DuplicateRegistrationError('acción', handler.type)
    }
    if (opts.requireCatalog && !getActionDefinition(handler.type)) {
      throw new DuplicateRegistrationError('acción', handler.type)
    }
    this.handlers.set(handler.type, handler)
    return this
  }

  has(type: string): boolean {
    return this.handlers.has(type)
  }

  get(type: string): ActionHandler | undefined {
    return this.handlers.get(type)
  }

  list(): ActionHandler[] {
    return [...this.handlers.values()]
  }
}

// ── Compatibilidad Fase 1 (deprecado) ───────────────────────────────────────

/** @deprecated Fase 1. Usa ActionStatus/ActionResult (Fase 3). */
export type ActionOutcomeStatus = 'EXECUTED' | 'SKIPPED' | 'NO_HANDLER' | 'FAILED'

/** @deprecated Fase 1. Vista reducida de ActionResult. */
export interface ActionOutcome {
  readonly actionId: string
  readonly type: string
  readonly status: ActionOutcomeStatus
  readonly detail?: unknown
  readonly error?: string
}

/** Proyecta un ActionResult (Fase 3) al ActionOutcome legado (Fase 1). */
export function toActionOutcome(result: ActionResult): ActionOutcome {
  const status: ActionOutcomeStatus =
    result.status === 'ROLLED_BACK' ? 'FAILED' : result.status
  return {
    actionId: result.actionId,
    type: result.type,
    status,
    detail: result.output,
    error: result.errors[0],
  }
}
