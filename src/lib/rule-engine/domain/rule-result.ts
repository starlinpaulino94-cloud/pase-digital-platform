/**
 * Rule Result: el objeto de respuesta ESTRUCTURADO del evaluador (Fase 2).
 *
 * Es el contrato que consumirán las fases futuras (QR, promociones, membresías):
 * responde de forma clara si la regla es válida, qué condiciones se evaluaron,
 * cuáles fallaron, por qué, cuánto tardó y qué errores de configuración hubo.
 * El evaluador NUNCA lanza por un fallo de validación: todo se reporta aquí.
 */

import type { LogicalOperator } from './condition-tree'
import type { DataType } from './data-types'

/** Códigos de error estables para diagnóstico (no son excepciones: son datos). */
export type EvaluationErrorCode =
  | 'UNKNOWN_OPERATOR' // el operador de la condición no está registrado
  | 'UNKNOWN_CONDITION_TYPE' // el conditionType no está registrado
  | 'INCOMPATIBLE_TYPE' // operador incompatible con el dataType de la condición
  | 'MISSING_FIELD' // el campo no existe en el contexto (cuando se exige)
  | 'INVALID_CONDITION_CONFIG' // condición mal configurada (regex inválida, rango, etc.)
  | 'INCOMPLETE_CONTEXT' // el contexto no trae datos necesarios
  | 'EVALUATION_ERROR' // fallo inesperado atrapado durante la evaluación

/** Problema detectado durante la validación o evaluación. */
export interface EvaluationIssue {
  readonly code: EvaluationErrorCode
  readonly message: string
  readonly conditionId?: string
  readonly field?: string
}

/** Resultado de una condición hoja. */
export interface ConditionOutcome {
  readonly kind: 'condition'
  readonly conditionId: string
  readonly conditionType: string
  readonly field: string
  readonly operator: string
  readonly dataType: DataType
  readonly expected: unknown
  readonly actual: unknown
  readonly passed: boolean
  /** Presente si la condición no pudo evaluarse (y cuenta como fallo). */
  readonly issue?: EvaluationIssue
}

/** Resultado de un grupo (nodo interno). */
export interface GroupOutcome {
  readonly kind: 'group'
  readonly groupId: string
  readonly operator: LogicalOperator
  readonly passed: boolean
  readonly children: readonly EvaluationOutcome[]
}

export type EvaluationOutcome = ConditionOutcome | GroupOutcome

/** Respuesta completa de evaluar una regla. */
export interface RuleResult {
  /** Resultado general: ¿la regla se cumple? */
  readonly valid: boolean
  readonly ruleId: string
  readonly ruleName: string
  /** Árbol de resultados (mismo shape que el árbol de condiciones). */
  readonly outcome: EvaluationOutcome | null
  readonly evaluatedConditions: number
  readonly passedConditions: number
  readonly failedConditions: number
  /** Errores de configuración/tipo/contexto encontrados. */
  readonly issues: readonly EvaluationIssue[]
  /** Motivo legible del rechazo (primera causa relevante) o null si es válida. */
  readonly rejectionReason: string | null
  readonly durationMs: number
  /** Detalles adicionales libres (métricas, banderas…). */
  readonly details: Readonly<Record<string, unknown>>
}

/** Recorre el árbol de resultados y cuenta condiciones evaluadas/ok/fallidas. */
export function summarizeOutcome(outcome: EvaluationOutcome | null): {
  evaluated: number
  passed: number
  failed: number
} {
  if (!outcome) return { evaluated: 0, passed: 0, failed: 0 }
  if (outcome.kind === 'condition') {
    return { evaluated: 1, passed: outcome.passed ? 1 : 0, failed: outcome.passed ? 0 : 1 }
  }
  return outcome.children.reduce(
    (acc, child) => {
      const s = summarizeOutcome(child)
      return {
        evaluated: acc.evaluated + s.evaluated,
        passed: acc.passed + s.passed,
        failed: acc.failed + s.failed,
      }
    },
    { evaluated: 0, passed: 0, failed: 0 },
  )
}

/** Primera condición fallida del árbol (en orden), para explicar el rechazo. */
export function firstFailedCondition(
  outcome: EvaluationOutcome | null,
): ConditionOutcome | null {
  if (!outcome) return null
  if (outcome.kind === 'condition') return outcome.passed ? null : outcome
  for (const child of outcome.children) {
    const failed = firstFailedCondition(child)
    if (failed) return failed
  }
  return null
}
