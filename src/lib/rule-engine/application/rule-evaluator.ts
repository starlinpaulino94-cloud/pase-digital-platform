/**
 * RuleEvaluator: evalúa una regla COMPLETA y produce un resultado estructurado.
 *
 * Fase 2: internamente compila la regla a un árbol de condiciones y delega en el
 * TreeEvaluator (que soporta grupos AND/OR/NOT/XOR anidados y nunca lanza).
 * Expone dos APIs:
 *  - `evaluateToResult()` → RuleResult rico (Fase 2), el contrato para QR/promos/membresías.
 *  - `evaluate()` → RuleMatchResult ligero (compat Fase 1), derivado del anterior.
 */

import type { RuleContext } from '../domain/context'
import type { OperatorRegistry } from '../domain/operators'
import {
  ConditionTypeRegistry,
  createDefaultConditionTypeRegistry,
} from '../domain/condition-types'
import type { Rule } from '../domain/types'
import {
  firstFailedCondition,
  summarizeOutcome,
  type ConditionOutcome,
  type EvaluationIssue,
  type EvaluationOutcome,
  type RuleResult,
} from '../domain/rule-result'
import { buildConditionTree } from './rule-compiler'
import { TreeEvaluator } from './tree-evaluator'

/** Resultado ligero por condición (compat Fase 1). */
export interface ConditionResult {
  readonly conditionId: string
  readonly field: string
  readonly operator: string
  readonly matched: boolean
  readonly actual: unknown
}

/** Resultado ligero de una regla (compat Fase 1). */
export interface RuleMatchResult {
  readonly ruleId: string
  readonly matched: boolean
  readonly matchType: Rule['matchType']
  readonly conditionResults: readonly ConditionResult[]
}

export class RuleEvaluator {
  private readonly treeEvaluator: TreeEvaluator

  constructor(
    operators: OperatorRegistry,
    conditionTypes: ConditionTypeRegistry = createDefaultConditionTypeRegistry(),
  ) {
    this.treeEvaluator = new TreeEvaluator({ operators, conditionTypes })
  }

  /** API rica de Fase 2: evalúa la regla y devuelve un RuleResult completo. */
  evaluateToResult(rule: Rule, context: RuleContext): RuleResult {
    const startedAt = Date.now()
    const tree = buildConditionTree(rule)
    const outcome = this.treeEvaluator.evaluate(tree, context)
    const { evaluated, passed, failed } = summarizeOutcome(outcome)
    const issues = collectIssues(outcome)
    const valid = outcome.passed

    return {
      valid,
      ruleId: rule.id,
      ruleName: rule.name,
      outcome,
      evaluatedConditions: evaluated,
      passedConditions: passed,
      failedConditions: failed,
      issues,
      rejectionReason: valid ? null : deriveRejectionReason(outcome, issues),
      durationMs: Date.now() - startedAt,
      details: { matchType: rule.matchType, hasCustomTree: rule.conditionTree !== null },
    }
  }

  /** API ligera de Fase 1: veredicto + resultado plano por condición. */
  evaluate(rule: Rule, context: RuleContext): RuleMatchResult {
    return toMatchResult(rule, this.evaluateToResult(rule, context))
  }
}

/** Deriva el resultado ligero (Fase 1) a partir de un RuleResult (sin reevaluar). */
export function toMatchResult(rule: Rule, result: RuleResult): RuleMatchResult {
  return {
    ruleId: rule.id,
    matched: result.valid,
    matchType: rule.matchType,
    conditionResults: flattenConditions(result.outcome).map((c) => ({
      conditionId: c.conditionId,
      field: c.field,
      operator: c.operator,
      matched: c.passed,
      actual: c.actual,
    })),
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function flattenConditions(outcome: EvaluationOutcome | null): ConditionOutcome[] {
  if (!outcome) return []
  if (outcome.kind === 'condition') return [outcome]
  return outcome.children.flatMap(flattenConditions)
}

function collectIssues(outcome: EvaluationOutcome | null): EvaluationIssue[] {
  return flattenConditions(outcome)
    .map((c) => c.issue)
    .filter((i): i is EvaluationIssue => i !== undefined)
}

function deriveRejectionReason(
  outcome: EvaluationOutcome,
  issues: readonly EvaluationIssue[],
): string {
  if (issues.length > 0) return issues[0].message
  const failed = firstFailedCondition(outcome)
  if (failed) {
    return `La condición "${failed.field}" (${failed.operator}) no se cumple.`
  }
  return 'La regla no se cumple.'
}
