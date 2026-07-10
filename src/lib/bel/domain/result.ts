/**
 * Resultado y errores del BEL (Fase 7).
 *
 * El motor NUNCA lanza por errores funcionales: devuelve un resultado
 * estructurado con el valor (si lo hay) y los problemas encontrados.
 */

import type { BelType, BelValue } from './values'

/** Códigos de error estables (datos, no excepciones de cara al consumidor). */
export type BelErrorCode =
  | 'SYNTAX_ERROR' // tokenización/parseo
  | 'UNBALANCED_PARENS' // paréntesis/corchetes desbalanceados
  | 'UNKNOWN_VARIABLE' // variable fuera del diccionario
  | 'UNKNOWN_FUNCTION' // función no registrada
  | 'ARITY_ERROR' // nº de argumentos incorrecto
  | 'TYPE_ERROR' // operación entre tipos incompatibles
  | 'DIVISION_BY_ZERO'
  | 'DEPTH_EXCEEDED' // profundidad de la expresión sobre el límite
  | 'RUNTIME_ERROR' // fallo inesperado atrapado

export interface BelIssue {
  readonly code: BelErrorCode
  readonly message: string
  /** Posición (offset de carácter) cuando aplica (errores de sintaxis). */
  readonly position?: number
}

/** Resultado de evaluar una expresión. */
export interface ExpressionResult {
  readonly ok: boolean
  readonly value: BelValue | undefined
  readonly type: BelType | undefined
  readonly issues: readonly BelIssue[]
}

/** Error interno usado para control de flujo; se convierte en BelIssue arriba. */
export class BelError extends Error {
  constructor(
    readonly code: BelErrorCode,
    message: string,
    readonly position?: number,
  ) {
    super(message)
    this.name = 'BelError'
  }

  toIssue(): BelIssue {
    return { code: this.code, message: this.message, position: this.position }
  }
}
