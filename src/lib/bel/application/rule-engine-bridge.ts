/**
 * Puente BEL → Rule Engine (Fase 7).
 *
 * Registra un TIPO DE CONDICIÓN "expression" en el Rule Engine: una condición
 * puede ahora ser una expresión BEL completa (en `condition.field`). El motor la
 * evalúa a través del ExpressionService y el operador (típicamente `is_true`)
 * decide el resultado. Así el BEL se convierte en el lenguaje oficial de reglas
 * SIN modificar el Rule Engine (usa su registro extensible de condition-types).
 */

import type { ConditionType } from '@/lib/rule-engine'
import type { ExpressionService } from './expression-service'

/**
 * Crea un ConditionType para el Rule Engine que evalúa expresiones BEL.
 *
 * Uso: registrar en el ConditionTypeRegistry y definir condiciones como
 *   { conditionType: 'expression', field: 'cliente.edad >= 18 AND compra.total > 2000',
 *     operator: 'is_true', dataType: 'BOOLEAN' }
 * La expresión se resuelve a su valor; el operador `is_true` comprueba el veredicto.
 */
export function createExpressionConditionType(
  service: ExpressionService,
  options: { now?: Date } = {},
): ConditionType {
  return {
    id: 'expression',
    description: 'Evalúa una expresión BEL (Business Expression Language).',
    resolve: ({ condition, context }) => {
      const result = service.evaluate(condition.field, context, { now: options.now })
      // En caso de error funcional, devuelve null (la condición no se cumple).
      return result.ok ? result.value : null
    },
  }
}
