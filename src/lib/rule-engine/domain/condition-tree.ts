/**
 * Árbol booleano de condiciones (Fase 2).
 *
 * Una regla ya no es una lista plana de condiciones: es un árbol donde los
 * nodos internos son GRUPOS (con un operador lógico AND/OR/NOT/XOR) y las hojas
 * son CONDICIONES. Esto permite expresar lógica arbitrariamente compleja
 * —"(A y B) o (no C)"— sin límite de anidamiento y sin tocar el motor.
 */

import type { RuleCondition } from './types'

/** Operadores lógicos de un grupo. Espeja el enum `RuleLogicalOperator`. */
export type LogicalOperator = 'AND' | 'OR' | 'NOT' | 'XOR'

/** Hoja del árbol: una condición atómica. */
export interface ConditionLeaf {
  readonly kind: 'condition'
  readonly condition: RuleCondition
}

/** Nodo interno: combina hijos (condiciones y/o subgrupos) con un operador. */
export interface ConditionGroupNode {
  readonly kind: 'group'
  readonly id: string
  readonly operator: LogicalOperator
  readonly children: readonly ConditionNode[]
}

export type ConditionNode = ConditionLeaf | ConditionGroupNode

// ── Constructores (API fluida para tests y fases futuras) ───────────────────

export function leaf(condition: RuleCondition): ConditionLeaf {
  return { kind: 'condition', condition }
}

export function group(
  operator: LogicalOperator,
  children: ConditionNode[],
  id = `grp_${operator.toLowerCase()}`,
): ConditionGroupNode {
  return { kind: 'group', id, operator, children }
}

export const and = (children: ConditionNode[], id?: string) => group('AND', children, id)
export const or = (children: ConditionNode[], id?: string) => group('OR', children, id)
export const not = (children: ConditionNode[], id?: string) => group('NOT', children, id)
export const xor = (children: ConditionNode[], id?: string) => group('XOR', children, id)

/** Recorre el árbol y devuelve todas las condiciones hoja (para validación/conteo). */
export function collectConditions(node: ConditionNode): RuleCondition[] {
  if (node.kind === 'condition') return [node.condition]
  return node.children.flatMap(collectConditions)
}

/** Profundidad del árbol (1 = una sola hoja o grupo sin anidar). */
export function treeDepth(node: ConditionNode): number {
  if (node.kind === 'condition') return 1
  if (node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map(treeDepth))
}
