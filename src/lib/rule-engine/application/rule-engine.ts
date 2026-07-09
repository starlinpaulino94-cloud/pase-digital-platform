/**
 * RuleEngine: el orquestador de la capa de aplicación.
 *
 * Coordina el caso de uso completo "evaluar las reglas de una empresa contra un
 * contexto": carga → evalúa → (si aplica) ejecuta acciones → audita. No conoce
 * Prisma ni el negocio: solo depende de puertos (RuleRepository, ExecutionLogSink)
 * y de colaboradores del dominio (RuleEvaluator, ActionExecutor), todos
 * inyectados por el constructor (Dependency Injection).
 */

import type { RuleContext } from '../domain/context'
import { isRuleEvaluable, type Rule } from '../domain/types'
import type { ActionOutcome } from '../domain/actions'
import type { RuleResult } from '../domain/rule-result'
import type { ActionExecutor } from './action-executor'
import { toMatchResult, type RuleEvaluator, type RuleMatchResult } from './rule-evaluator'
import {
  NoopRuleCache,
  ruleCacheKey,
  snapshotContext,
  type ExecutionLogSink,
  type RuleCache,
  type RuleRepository,
} from './ports'

export interface RuleEngineDeps {
  readonly repository: RuleRepository
  readonly evaluator: RuleEvaluator
  readonly executor: ActionExecutor
  readonly logSink: ExecutionLogSink
  /** Caché de reglas (opcional). Por defecto NoopRuleCache (sin caché). */
  readonly cache?: RuleCache
}

export interface RuleEngineQuery {
  readonly companyId: string
  /** Restringe la evaluación a un grupo de reglas (por su `key`). */
  readonly groupKey?: string
  /** Momento de referencia (por defecto: el timestamp del contexto). */
  readonly at?: Date
}

/** Resultado de evaluar UNA regla. */
export interface RuleEvaluationResult {
  readonly rule: Rule
  /** Resultado rico (Fase 2): árbol de resultados, issues, motivo de rechazo. */
  readonly result: RuleResult
  /** Resultado ligero (compat Fase 1). */
  readonly match: RuleMatchResult
  readonly actions: readonly ActionOutcome[]
  readonly durationMs: number
}

/** Resultado agregado de una corrida del motor. */
export interface RuleEngineRunResult {
  readonly companyId: string
  readonly evaluated: number
  readonly matched: number
  readonly results: readonly RuleEvaluationResult[]
}

export class RuleEngine {
  constructor(private readonly deps: RuleEngineDeps) {}

  /**
   * Ejecuta el motor: evalúa todas las reglas aplicables, en orden de prioridad
   * (mayor primero), y ejecuta las acciones de las que se cumplen. Devuelve un
   * informe detallado. Cada regla se aísla: un error evaluando una no aborta el
   * resto (se registra en su auditoría y se continúa).
   */
  async run(query: RuleEngineQuery, context: RuleContext): Promise<RuleEngineRunResult> {
    const at = query.at ?? context.timestamp
    const cache = this.deps.cache ?? new NoopRuleCache()
    const cacheKey = ruleCacheKey(query.companyId, query.groupKey)

    // Caché → repositorio (la caché por defecto siempre falla, así que va a BD).
    let rules = await cache.get(cacheKey)
    if (!rules) {
      rules = await this.deps.repository.findApplicable({
        companyId: query.companyId,
        groupKey: query.groupKey,
        at,
      })
      await cache.set(cacheKey, rules)
    }

    // Doble red de seguridad: el repositorio ya filtra, pero volvemos a validar
    // la ventana de vigencia con la definición canónica del dominio.
    const evaluable = rules
      .filter((rule) => isRuleEvaluable(rule, at))
      .sort((a, b) => b.priority - a.priority)

    const results: RuleEvaluationResult[] = []
    let matchedCount = 0

    for (const rule of evaluable) {
      const startedAt = Date.now()
      const result = this.deps.evaluator.evaluateToResult(rule, context)
      const match = toMatchResult(rule, result)
      let actions: readonly ActionOutcome[] = []
      let error: string | null = null

      try {
        if (result.valid) {
          const report = await this.deps.executor.execute(rule, context)
          actions = report.outcomes
          matchedCount++
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err)
      }

      const durationMs = Date.now() - startedAt

      // Auditoría (el sink por defecto la descarta). Incluye motivo del rechazo,
      // errores de configuración y las acciones intentadas.
      await this.deps.logSink.record({
        ruleId: rule.id,
        companyId: query.companyId,
        matched: result.valid,
        result: {
          matched: result.valid,
          rejectionReason: result.rejectionReason,
          issues: result.issues,
          actions: actions.map((a) => ({ type: a.type, status: a.status })),
          error,
        },
        context: snapshotContext(context),
        durationMs,
        error,
      })

      results.push({ rule, result, match, actions, durationMs })
    }

    return {
      companyId: query.companyId,
      evaluated: results.length,
      matched: matchedCount,
      results,
    }
  }
}
