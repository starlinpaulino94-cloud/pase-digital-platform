/**
 * RuleValidator: validación ESTÁTICA de una regla (sin contexto).
 *
 * Detecta problemas de configuración antes de evaluar —operadores inválidos,
 * tipos incompatibles, condiciones mal configuradas, tipos de condición
 * inexistentes— y los devuelve como lista de issues. Nunca lanza. Es la red que
 * exige la especificación: "el Rule Engine debe validar automáticamente".
 */

import { buildConditionTree, type CompiledRule } from './rule-compiler'
import { collectConditions } from '../domain/condition-tree'
import type { OperatorRegistry } from '../domain/operators'
import type { ConditionTypeRegistry } from '../domain/condition-types'
import type { Rule, RuleCondition } from '../domain/types'
import type { EvaluationIssue } from '../domain/rule-result'

export interface RuleValidatorDeps {
  readonly operators: OperatorRegistry
  readonly conditionTypes: ConditionTypeRegistry
}

export class RuleValidator {
  constructor(private readonly deps: RuleValidatorDeps) {}

  /** Devuelve la lista de problemas de la regla. Vacía = regla bien formada. */
  validate(rule: Rule): EvaluationIssue[] {
    const tree = buildConditionTree(rule)
    const conditions = collectConditions(tree)
    return conditions.flatMap((c) => this.validateCondition(c))
  }

  /** Conveniencia: valida y devuelve también el árbol compilado. */
  compileAndValidate(rule: Rule): { compiled: CompiledRule; issues: EvaluationIssue[] } {
    return { compiled: { rule, tree: buildConditionTree(rule) }, issues: this.validate(rule) }
  }

  private validateCondition(condition: RuleCondition): EvaluationIssue[] {
    const issues: EvaluationIssue[] = []
    const at = { conditionId: condition.id, field: condition.field }

    // Tipo de condición registrado + su validación de config propia.
    const conditionType = this.deps.conditionTypes.tryGet(condition.conditionType)
    if (!conditionType) {
      issues.push({
        code: 'UNKNOWN_CONDITION_TYPE',
        message: `Tipo de condición desconocido: "${condition.conditionType}".`,
        ...at,
      })
    } else if (conditionType.validate) {
      const msg = conditionType.validate(condition)
      if (msg) issues.push({ code: 'INVALID_CONDITION_CONFIG', message: msg, ...at })
    }

    // Operador registrado.
    const operator = this.deps.operators.tryGet(condition.operator)
    if (!operator) {
      issues.push({
        code: 'UNKNOWN_OPERATOR',
        message: `Operador desconocido: "${condition.operator}".`,
        ...at,
      })
      return issues // sin operador no tiene sentido validar más
    }

    // Compatibilidad operador ↔ tipo de dato.
    if (operator.supportedTypes && !operator.supportedTypes.includes(condition.dataType)) {
      issues.push({
        code: 'INCOMPATIBLE_TYPE',
        message: `El operador "${condition.operator}" no admite el tipo ${condition.dataType}.`,
        ...at,
      })
    }

    // Config específica del valor esperado según el operador.
    issues.push(...this.validateValueShape(condition, at))
    return issues
  }

  private validateValueShape(
    condition: RuleCondition,
    at: { conditionId: string; field: string },
  ): EvaluationIssue[] {
    const { operator, value } = condition
    const invalid = (message: string): EvaluationIssue => ({
      code: 'INVALID_CONDITION_CONFIG',
      message,
      ...at,
    })

    if (operator === 'between' || operator === 'not_between') {
      if (!Array.isArray(value) || value.length !== 2) {
        return [invalid(`"${operator}" requiere un valor [min, max].`)]
      }
    }
    if (operator === 'in' || operator === 'not_in') {
      if (!Array.isArray(value)) {
        return [invalid(`"${operator}" requiere una lista como valor.`)]
      }
    }
    if (operator === 'matches') {
      if (typeof value !== 'string') {
        return [invalid('"matches" requiere una expresión regular en texto.')]
      }
      try {
        new RegExp(value)
      } catch {
        return [invalid(`Expresión regular inválida: "${value}".`)]
      }
    }
    return []
  }
}
