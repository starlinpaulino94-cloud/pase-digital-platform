/**
 * Action Result: objeto estándar de respuesta de una acción (Fase 3).
 *
 * Contrato que consumirán las fases futuras (promociones, membresías, QR):
 * indica la acción ejecutada, su estado, errores, advertencias, tiempo, datos
 * generados e información adicional. Junto con el informe agregado
 * (ActionExecutionReport) permite saber EXACTAMENTE qué pasó con cada acción.
 */

/**
 * Estado del intento de ejecutar una acción.
 * - EXECUTED: el handler corrió con éxito.
 * - SKIPPED: la acción estaba desactivada (activa=false) o se omitió.
 * - NO_HANDLER: no hay handler registrado para el tipo (Fase 3: caso normal).
 * - FAILED: el handler lanzó/reportó error tras agotar reintentos.
 * - ROLLED_BACK: se ejecutó pero luego se revirtió por el fallo de otra acción.
 */
export type ActionStatus = 'EXECUTED' | 'SKIPPED' | 'NO_HANDLER' | 'FAILED' | 'ROLLED_BACK'

export interface ActionResult {
  readonly actionId: string
  readonly type: string
  readonly status: ActionStatus
  /** ¿La acción era obligatoria? (define si su fallo hunde la ejecución). */
  readonly required: boolean
  /** Datos generados por la acción (libre): ids creados, montos, tokens… */
  readonly output: Readonly<Record<string, unknown>>
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  /** Nº de intentos realizados (1 + reintentos consumidos). */
  readonly attempts: number
  readonly durationMs: number
  /** Información adicional (contexto de diagnóstico). */
  readonly details: Readonly<Record<string, unknown>>
}

/** Informe agregado de ejecutar el conjunto de acciones de una regla. */
export interface ActionExecutionReport {
  readonly ruleId?: string
  readonly results: readonly ActionResult[]
  readonly executed: number
  readonly failed: number
  readonly skipped: number
  readonly noHandler: number
  readonly rolledBack: number
  /** true si NINGUNA acción obligatoria falló. */
  readonly success: boolean
  readonly durationMs: number
}

/** Fabrica un ActionResult con valores por defecto sensatos. */
export function makeActionResult(
  partial: Pick<ActionResult, 'actionId' | 'type' | 'status' | 'required'> &
    Partial<ActionResult>,
): ActionResult {
  return {
    output: {},
    errors: [],
    warnings: [],
    attempts: 0,
    durationMs: 0,
    details: {},
    ...partial,
  }
}

/** Agrega una lista de resultados en un informe (con sus conteos). */
export function buildReport(
  results: ActionResult[],
  ruleId: string | undefined,
  durationMs: number,
): ActionExecutionReport {
  const count = (s: ActionStatus) => results.filter((r) => r.status === s).length
  const failed = count('FAILED')
  // La ejecución es exitosa si ninguna acción OBLIGATORIA falló.
  const success = !results.some((r) => r.required && r.status === 'FAILED')
  return {
    ruleId,
    results,
    executed: count('EXECUTED'),
    failed,
    skipped: count('SKIPPED'),
    noHandler: count('NO_HANDLER'),
    rolledBack: count('ROLLED_BACK'),
    success,
    durationMs,
  }
}
