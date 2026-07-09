/**
 * RuleCompiler: convierte una regla en un árbol de condiciones evaluable.
 *
 * Puente de compatibilidad entre Fase 1 (lista plana + matchType) y Fase 2
 * (árbol booleano):
 * - Si la regla ya trae `conditionTree`, se usa tal cual.
 * - Si no, se compila desde `conditions` + `matchType`: ALL → grupo AND,
 *   ANY → grupo OR. Sin condiciones → grupo AND vacío (que se cumple siempre,
 *   conservando la semántica de Fase 1 "regla incondicional aplica siempre").
 *
 * La "compilación" también es el punto natural donde, en el futuro, cachear el
 * árbol ya construido por regla (ver RuleCache) para no recompilar en cada
 * evaluación de alta frecuencia.
 */

import { and, group, leaf, type ConditionNode } from '../domain/condition-tree'
import type { Rule } from '../domain/types'

export interface CompiledRule {
  readonly rule: Rule
  readonly tree: ConditionNode
}

/** Construye (o reutiliza) el árbol de condiciones de una regla. */
export function buildConditionTree(rule: Rule): ConditionNode {
  if (rule.conditionTree) return rule.conditionTree

  const leaves = [...rule.conditions]
    .sort((a, b) => a.order - b.order)
    .map(leaf)

  if (leaves.length === 0) {
    // Regla sin condiciones → grupo AND vacío → se cumple siempre.
    return and([], `rule_${rule.id}_root`)
  }

  const operator = rule.matchType === 'ANY' ? 'OR' : 'AND'
  return group(operator, leaves, `rule_${rule.id}_root`)
}

/** Compila una regla a su forma evaluable. */
export function compileRule(rule: Rule): CompiledRule {
  return { rule, tree: buildConditionTree(rule) }
}
