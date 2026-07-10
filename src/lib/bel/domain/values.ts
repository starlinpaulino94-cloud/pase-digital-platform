/**
 * Sistema de valores y tipos del BEL (Fase 7).
 *
 * Define los tipos que maneja el lenguaje en runtime y las utilidades de
 * comprobación/comparación. Base para "no permitir operaciones incompatibles"
 * con errores claros.
 */

/** Tipo de un valor BEL en runtime. */
export type BelType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'NULL' | 'DATE' | 'LIST' | 'OBJECT'

/** Valor manejado por el evaluador. */
export type BelValue =
  | number
  | string
  | boolean
  | null
  | Date
  | readonly unknown[]
  | Record<string, unknown>

/** Infiera el tipo BEL de un valor. */
export function belTypeOf(value: unknown): BelType {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return 'NUMBER'
  if (typeof value === 'string') return 'STRING'
  if (typeof value === 'boolean') return 'BOOLEAN'
  if (value instanceof Date) return 'DATE'
  if (Array.isArray(value)) return 'LIST'
  return 'OBJECT'
}

/** Tipos que admiten comparación ordinal (>,>=,<,<=). */
export function isOrdinal(type: BelType): boolean {
  return type === 'NUMBER' || type === 'DATE' || type === 'STRING'
}

/** Convierte a número comparable (fechas → epoch); NaN si no es posible. */
export function toComparableNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  return NaN
}

/** Igualdad estructural laxa (fechas por epoch, resto por valor). */
export function belEquals(a: unknown, b: unknown): boolean {
  const ta = belTypeOf(a)
  const tb = belTypeOf(b)
  if (ta === 'DATE' || tb === 'DATE') {
    return toComparableNumber(a) === toComparableNumber(b)
  }
  if (ta === 'LIST' && tb === 'LIST') {
    const la = a as unknown[]
    const lb = b as unknown[]
    return la.length === lb.length && la.every((x, i) => belEquals(x, lb[i]))
  }
  return a === b
}

/** "Vacío": null, string en blanco, lista/objeto sin elementos. */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object' && !(value instanceof Date)) return Object.keys(value).length === 0
  return false
}

/** Convierte un patrón LIKE (con % y _) a expresión regular. */
export function likeToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = '^' + escaped.replace(/%/g, '.*').replace(/_/g, '.') + '$'
  return new RegExp(re, 'i')
}
