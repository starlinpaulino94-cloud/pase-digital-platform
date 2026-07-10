/**
 * Semántica de los operadores lógicos de grupo (Fase 2).
 *
 * Funciones PURAS que combinan los resultados booleanos de los hijos de un
 * grupo. Aisladas aquí para que sean triviales de razonar y de extender.
 */

import type { LogicalOperator } from './condition-tree'

/**
 * Combina los resultados de los hijos según el operador del grupo.
 *
 * - **AND**: todos los hijos se cumplen. Grupo vacío → true (neutro del AND).
 * - **OR**: al menos un hijo se cumple. Grupo vacío → false.
 * - **NOT**: negación del AND de los hijos, es decir NO se cumplen todos.
 *   Con un único hijo equivale a negarlo. Grupo vacío → false (niega el true).
 * - **XOR**: EXACTAMENTE un hijo se cumple (interpretación de negocio "solo uno
 *   de estos"). Grupo vacío → false.
 */
export function combine(operator: LogicalOperator, childResults: readonly boolean[]): boolean {
  switch (operator) {
    case 'AND':
      return childResults.every(Boolean)
    case 'OR':
      return childResults.some(Boolean)
    case 'NOT':
      return !childResults.every(Boolean)
    case 'XOR':
      return childResults.filter(Boolean).length === 1
  }
}

/** ¿Es `value` un LogicalOperator válido? (al mapear desde la BD). */
export function isLogicalOperator(value: unknown): value is LogicalOperator {
  return value === 'AND' || value === 'OR' || value === 'NOT' || value === 'XOR'
}
