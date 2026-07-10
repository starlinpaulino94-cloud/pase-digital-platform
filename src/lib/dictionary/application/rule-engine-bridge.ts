/**
 * Puente Diccionario → Rule Engine (Fase 6).
 *
 * Es la forma OFICIAL en que el Rule Engine consume el diccionario: una condición
 * ya NO referencia una cadena de texto suelta, sino una VARIABLE del diccionario
 * (por id, clave o alias). El puente la resuelve a la ruta del Context Model y a
 * su DataType, validando que exista, esté activa y sea del contexto. Así se
 * impide referenciar variables inexistentes o comparar tipos incompatibles.
 */

import type { DataType } from '@/lib/rule-engine'
import { toRuleDataType } from '../domain/taxonomy'
import type { Dictionary } from '../domain/dictionary'
import type { DataDefinition } from '../domain/types'

/** Especificación de campo lista para una condición del Rule Engine. */
export interface ConditionFieldSpec {
  /** Ruta que el Rule Engine resolverá contra el contexto (Context Model). */
  readonly field: string
  /** DataType para la validación de compatibilidad de operadores. */
  readonly dataType: DataType
  /** Variable del diccionario de la que proviene. */
  readonly variable: DataDefinition
}

export type ResolveFieldResult =
  | { readonly ok: true; readonly spec: ConditionFieldSpec }
  | { readonly ok: false; readonly error: string }

/**
 * Resuelve una referencia (id, clave o alias) a una especificación de campo para
 * el Rule Engine. Rechaza variables inexistentes, desactivadas o sin ruta de
 * contexto (p. ej. calculadas, que aún no tienen resolución en esta fase).
 */
export function resolveConditionField(
  dictionary: Dictionary,
  ref: string,
): ResolveFieldResult {
  const variable =
    dictionary.get(ref) ?? dictionary.getByKey(ref) ?? dictionary.resolveAlias(ref)

  if (!variable) {
    return { ok: false, error: `Variable no encontrada en el diccionario: "${ref}".` }
  }
  if (variable.status === 'DISABLED') {
    return { ok: false, error: `La variable "${variable.key}" está desactivada.` }
  }
  if (variable.source === 'CALCULATED' || !variable.contextPath) {
    return {
      ok: false,
      error: `La variable "${variable.key}" no tiene ruta de contexto (¿calculada?): resolución no disponible en esta fase.`,
    }
  }

  return {
    ok: true,
    spec: {
      field: variable.contextPath,
      dataType: toRuleDataType(variable.semanticType),
      variable,
    },
  }
}
