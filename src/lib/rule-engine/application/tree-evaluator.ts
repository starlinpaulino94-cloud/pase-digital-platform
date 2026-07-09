/**
 * TreeEvaluator: evalúa un árbol de condiciones contra un contexto (Fase 2).
 *
 * Recorre el árbol recursivamente y produce un árbol de resultados espejo. NUNCA
 * lanza por errores de validación (operador desconocido, tipo incompatible,
 * config inválida): cada problema se captura como `EvaluationIssue` y la
 * condición cuenta como fallida. Solo así el motor puede "responder siempre con
 * información clara", como exige la especificación.
 */

import type { RuleContext } from '../domain/context'
import type { ConditionNode } from '../domain/condition-tree'
import { combine } from '../domain/logical'
import type { OperatorRegistry } from '../domain/operators'
import type { ConditionTypeRegistry } from '../domain/condition-types'
import type { RuleCondition } from '../domain/types'
import type {
  ConditionOutcome,
  EvaluationIssue,
  EvaluationOutcome,
  GroupOutcome,
} from '../domain/rule-result'

export interface TreeEvaluatorDeps {
  readonly operators: OperatorRegistry
  readonly conditionTypes: ConditionTypeRegistry
}

export class TreeEvaluator {
  constructor(private readonly deps: TreeEvaluatorDeps) {}

  /** Evalúa un nodo (grupo o condición) y devuelve su resultado estructurado. */
  evaluate(node: ConditionNode, context: RuleContext): EvaluationOutcome {
    if (node.kind === 'condition') {
      return this.evaluateCondition(node.condition, context)
    }
    return this.evaluateGroup(node, context)
  }

  private evaluateGroup(
    node: Extract<ConditionNode, { kind: 'group' }>,
    context: RuleContext,
  ): GroupOutcome {
    const children = node.children.map((child) => this.evaluate(child, context))
    const passed = combine(node.operator, children.map((c) => c.passed))
    return { kind: 'group', groupId: node.id, operator: node.operator, passed, children }
  }

  private evaluateCondition(
    condition: RuleCondition,
    context: RuleContext,
  ): ConditionOutcome {
    const base = {
      kind: 'condition' as const,
      conditionId: condition.id,
      conditionType: condition.conditionType,
      field: condition.field,
      operator: condition.operator,
      dataType: condition.dataType,
      expected: condition.value,
    }

    // 1. El tipo de condición debe existir (resuelve el valor real).
    const conditionType = this.deps.conditionTypes.tryGet(condition.conditionType)
    if (!conditionType) {
      return this.failed(base, undefined, {
        code: 'UNKNOWN_CONDITION_TYPE',
        message: `Tipo de condición desconocido: "${condition.conditionType}".`,
        conditionId: condition.id,
        field: condition.field,
      })
    }

    // 2. El operador debe existir.
    const operator = this.deps.operators.tryGet(condition.operator)
    if (!operator) {
      return this.failed(base, undefined, {
        code: 'UNKNOWN_OPERATOR',
        message: `Operador desconocido: "${condition.operator}".`,
        conditionId: condition.id,
        field: condition.field,
      })
    }

    // 3. Compatibilidad de tipos: el operador debe aceptar el dataType declarado.
    if (operator.supportedTypes && !operator.supportedTypes.includes(condition.dataType)) {
      return this.failed(base, undefined, {
        code: 'INCOMPATIBLE_TYPE',
        message: `El operador "${condition.operator}" no admite el tipo ${condition.dataType}.`,
        conditionId: condition.id,
        field: condition.field,
      })
    }

    // 4. Resolver el valor real y comparar. Cualquier excepción → issue, no throw.
    try {
      const actual = conditionType.resolve({ condition, context })
      const passed = operator.evaluate(actual, condition.value)
      return { ...base, actual, passed }
    } catch (err) {
      return this.failed(base, undefined, {
        code: 'EVALUATION_ERROR',
        message: err instanceof Error ? err.message : String(err),
        conditionId: condition.id,
        field: condition.field,
      })
    }
  }

  private failed(
    base: Omit<ConditionOutcome, 'actual' | 'passed' | 'issue'>,
    actual: unknown,
    issue: EvaluationIssue,
  ): ConditionOutcome {
    return { ...base, actual, passed: false, issue }
  }
}
