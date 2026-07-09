/**
 * ActionExecutor: el Motor de Ejecución de Acciones (Fase 3).
 *
 * Ejecuta el conjunto de acciones de una regla que se cumplió, de forma
 * SECUENCIAL y por PRIORIDAD (`order` ascendente). Cada acción se resuelve
 * contra el ActionRegistry y se ejecuta con:
 *   - reintentos (maxRetries),
 *   - aislamiento de errores (el fallo de una NO detiene el resto),
 *   - distinción obligatoria/opcional,
 *   - arquitectura de rollback (compensación de acciones ya ejecutadas cuando
 *     una obligatoria falla, si se habilita).
 *
 * En Fase 3 no hay handlers registrados: todas las acciones resultan NO_HANDLER
 * (se documenta qué se habría ejecutado, sin ningún efecto de negocio).
 */

import type { ActionContext } from '../domain/action-context'
import {
  buildReport,
  makeActionResult,
  type ActionExecutionReport,
  type ActionResult,
} from '../domain/action-result'
import type { ActionExecutionInput, ActionRegistry } from '../domain/actions'
import type { Rule, RuleAction } from '../domain/types'

export interface ActionExecutorOptions {
  /**
   * Si una acción OBLIGATORIA falla, revertir (rollback) las acciones ya
   * ejecutadas que soporten compensación. Por defecto false (Fase 3: solo
   * arquitectura; se activa cuando existan handlers transaccionales).
   */
  readonly rollbackOnRequiredFailure?: boolean
  /**
   * Detener la secuencia al primer fallo de una acción OBLIGATORIA. Por defecto
   * false: se aíslan errores y se continúa, reportando cada uno.
   */
  readonly stopOnRequiredFailure?: boolean
}

export class ActionExecutor {
  constructor(
    private readonly registry: ActionRegistry,
    private readonly options: ActionExecutorOptions = {},
  ) {}

  async execute(
    rule: Rule,
    context: ActionContext,
  ): Promise<ActionExecutionReport> {
    const startedAt = Date.now()
    const ordered = [...rule.actions].sort((a, b) => a.order - b.order)
    const results: ActionResult[] = []
    // Acciones ejecutadas con éxito que podrían compensarse (para rollback).
    const compensable: Array<{ action: RuleAction; result: ActionResult }> = []

    for (const action of ordered) {
      const result = await this.runAction(rule, action, context)
      results.push(result)

      if (result.status === 'EXECUTED') {
        const handler = this.registry.get(action.type)
        if (handler?.supportsRollback) compensable.push({ action, result })
      }

      // Fallo de una acción OBLIGATORIA: rollback y/o corte, según opciones.
      if (result.status === 'FAILED' && action.required) {
        if (this.options.rollbackOnRequiredFailure) {
          await this.rollback(rule, context, compensable, results)
        }
        if (this.options.stopOnRequiredFailure) break
      }
    }

    return buildReport(results, rule.id, Date.now() - startedAt)
  }

  /** Ejecuta una acción con reintentos y aislamiento de errores. */
  private async runAction(
    rule: Rule,
    action: RuleAction,
    context: ActionContext,
  ): Promise<ActionResult> {
    const startedAt = Date.now()

    if (!action.enabled) {
      return makeActionResult({
        actionId: action.id,
        type: action.type,
        status: 'SKIPPED',
        required: action.required,
        details: { reason: 'Acción desactivada (activa=false).' },
      })
    }

    const handler = this.registry.get(action.type)
    if (!handler) {
      // Fase 3: sin handler registrado. Se documenta, no se ejecuta nada.
      return makeActionResult({
        actionId: action.id,
        type: action.type,
        status: 'NO_HANDLER',
        required: action.required,
        details: { reason: 'No hay handler registrado para este tipo de acción.' },
      })
    }

    const input: ActionExecutionInput = { rule, action, context }
    const errors: string[] = []
    const maxAttempts = 1 + Math.max(0, action.maxRetries)

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await handler.execute(input)
        return {
          ...result,
          attempts: attempt,
          durationMs: Date.now() - startedAt,
          // El executor es la autoridad sobre `required` (viene de la config).
          required: action.required,
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
        // Si quedan intentos, reintenta; si no, cae a FAILED abajo.
      }
    }

    return makeActionResult({
      actionId: action.id,
      type: action.type,
      status: 'FAILED',
      required: action.required,
      errors,
      attempts: maxAttempts,
      durationMs: Date.now() - startedAt,
    })
  }

  /**
   * Compensa (revierte) las acciones ya ejecutadas que lo soporten, en orden
   * inverso. Marca sus resultados como ROLLED_BACK. Best-effort: un fallo de
   * compensación se anota como warning y no interrumpe el resto.
   */
  private async rollback(
    rule: Rule,
    context: ActionContext,
    compensable: Array<{ action: RuleAction; result: ActionResult }>,
    results: ActionResult[],
  ): Promise<void> {
    for (const { action, result } of [...compensable].reverse()) {
      const handler = this.registry.get(action.type)
      if (!handler?.rollback) continue
      try {
        await handler.rollback({ rule, action, context }, result)
        markRolledBack(results, result.actionId)
      } catch (err) {
        markRolledBack(results, result.actionId, err instanceof Error ? err.message : String(err))
      }
    }
  }
}

/** Sustituye el resultado de una acción por su versión ROLLED_BACK. */
function markRolledBack(results: ActionResult[], actionId: string, warning?: string): void {
  const idx = results.findIndex((r) => r.actionId === actionId)
  if (idx === -1) return
  const prev = results[idx]
  results[idx] = {
    ...prev,
    status: 'ROLLED_BACK',
    warnings: warning ? [...prev.warnings, `Rollback: ${warning}`] : prev.warnings,
  }
}
