/**
 * Evaluación de una condición ATÓMICA.
 *
 * El ConditionEvaluator es deliberadamente diminuto: resuelve el campo del
 * contexto y delega la comparación en el operador correspondiente. No conoce
 * combinaciones AND/OR (eso es responsabilidad de la capa de aplicación) ni
 * nada del negocio.
 */

import { resolveField, type RuleContext } from './context'
import type { OperatorRegistry } from './operators'
import type { RuleCondition } from './types'

export interface ConditionResult {
  readonly conditionId: string
  readonly field: string
  readonly operator: string
  readonly matched: boolean
  /** Valor real resuelto del contexto (útil para depurar y auditar). */
  readonly actual: unknown
}

export class ConditionEvaluator {
  constructor(private readonly operators: OperatorRegistry) {}

  /**
   * Evalúa una sola condición. Lanza UnknownOperatorError si el operador no
   * está registrado (fallo de configuración que conviene hacer explícito).
   */
  evaluate(condition: RuleCondition, context: RuleContext): ConditionResult {
    const actual = resolveField(context, condition.field)
    const operator = this.operators.get(condition.operator)
    const matched = operator.evaluate(actual, condition.value)
    return {
      conditionId: condition.id,
      field: condition.field,
      operator: condition.operator,
      matched,
      actual,
    }
  }
}
