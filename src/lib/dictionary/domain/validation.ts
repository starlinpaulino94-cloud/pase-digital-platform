/**
 * Validación de valores contra la definición de una variable (Fase 6).
 *
 * Reutilizable por otros módulos: dada una `DataDefinition` y un valor, aplica
 * las `ValidationRules` (rango, longitud, valores permitidos, patrón, tipo) y
 * devuelve la lista de problemas. Nunca lanza.
 */

import { toRuleDataType } from './taxonomy'
import type { DataDefinition } from './types'

export interface ValidationIssue {
  readonly code:
    | 'WRONG_TYPE'
    | 'OUT_OF_RANGE'
    | 'TOO_SHORT'
    | 'TOO_LONG'
    | 'NOT_ALLOWED'
    | 'PATTERN_MISMATCH'
    | 'MISSING'
  readonly message: string
}

/** Comprueba, de forma laxa, que el valor concuerde con el DataType base. */
function matchesBaseType(def: DataDefinition, value: unknown): boolean {
  const dt = toRuleDataType(def.semanticType)
  switch (dt) {
    case 'NUMBER':
      return typeof value === 'number' && !Number.isNaN(value)
    case 'BOOLEAN':
      return typeof value === 'boolean'
    case 'TEXT':
    case 'ENUM':
      return typeof value === 'string'
    case 'DATE':
      return value instanceof Date || (typeof value === 'string' && !Number.isNaN(Date.parse(value)))
    case 'TIME':
      return typeof value === 'number' || typeof value === 'string'
    case 'LIST':
      return Array.isArray(value)
    case 'OBJECT':
    case 'JSON':
      return typeof value === 'object' && value !== null
  }
}

/** Valida `value` contra la definición. Devuelve [] si es válido. */
export function validateValue(def: DataDefinition, value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const v = def.validation

  if (value === null || value === undefined) {
    if (v.requiredType) issues.push({ code: 'MISSING', message: `${def.key} es obligatorio.` })
    return issues
  }

  if (v.requiredType && !matchesBaseType(def, value)) {
    issues.push({ code: 'WRONG_TYPE', message: `${def.key} debe ser de tipo ${def.semanticType}.` })
  }

  if (typeof value === 'number') {
    if (v.min !== undefined && value < v.min) issues.push({ code: 'OUT_OF_RANGE', message: `${def.key} < ${v.min}.` })
    if (v.max !== undefined && value > v.max) issues.push({ code: 'OUT_OF_RANGE', message: `${def.key} > ${v.max}.` })
  }

  if (typeof value === 'string') {
    if (v.minLength !== undefined && value.length < v.minLength) issues.push({ code: 'TOO_SHORT', message: `${def.key}: longitud < ${v.minLength}.` })
    if (v.maxLength !== undefined && value.length > v.maxLength) issues.push({ code: 'TOO_LONG', message: `${def.key}: longitud > ${v.maxLength}.` })
    if (v.pattern) {
      try {
        if (!new RegExp(v.pattern).test(value)) issues.push({ code: 'PATTERN_MISMATCH', message: `${def.key} no cumple el patrón.` })
      } catch {
        // patrón inválido en la definición: se ignora aquí (lo valida el registro).
      }
    }
  }

  if (v.allowedValues && !v.allowedValues.some((allowed) => allowed === value)) {
    issues.push({ code: 'NOT_ALLOWED', message: `${def.key}: valor no permitido.` })
  }

  return issues
}
