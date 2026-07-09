/**
 * Sistema de tipos de dato del lenguaje universal (Fase 2).
 *
 * Cada condición declara el tipo de dato que evalúa. El motor usa este tipo
 * para impedir comparaciones incompatibles (ej. "mayor que" sobre un booleano)
 * ANTES de evaluar, devolviendo un error estructurado en vez de un resultado
 * silenciosamente incorrecto.
 */

/** Catálogo de tipos de dato soportados. Extensible: añadir uno es sumar aquí. */
export type DataType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'TIME'
  | 'BOOLEAN'
  | 'LIST'
  | 'OBJECT'
  | 'ENUM'
  | 'JSON'

export const DATA_TYPES: readonly DataType[] = [
  'TEXT',
  'NUMBER',
  'DATE',
  'TIME',
  'BOOLEAN',
  'LIST',
  'OBJECT',
  'ENUM',
  'JSON',
]

/** ¿Es `raw` un DataType válido? Útil al mapear desde la BD (columna String). */
export function isDataType(raw: unknown): raw is DataType {
  return typeof raw === 'string' && (DATA_TYPES as readonly string[]).includes(raw)
}

/** Normaliza un string arbitrario a DataType; por defecto TEXT. */
export function toDataType(raw: unknown): DataType {
  return isDataType(raw) ? raw : 'TEXT'
}

/**
 * Tipos que admiten orden (comparaciones </<=/>/>=/between). El resto solo
 * admite igualdad, pertenencia o predicados.
 */
export const ORDINAL_TYPES: readonly DataType[] = ['NUMBER', 'DATE', 'TIME']

/** ¿El tipo admite comparación ordinal? */
export function isOrdinal(type: DataType): boolean {
  return ORDINAL_TYPES.includes(type)
}

/**
 * Infiere el DataType de un valor en runtime. Se usa solo para diagnóstico
 * (mensajes de error claros); la validación real se basa en el tipo DECLARADO
 * de la condición, no en el inferido.
 */
export function inferDataType(value: unknown): DataType {
  if (value === null || value === undefined) return 'JSON'
  if (typeof value === 'boolean') return 'BOOLEAN'
  if (typeof value === 'number') return 'NUMBER'
  if (value instanceof Date) return 'DATE'
  if (Array.isArray(value)) return 'LIST'
  if (typeof value === 'object') return 'OBJECT'
  return 'TEXT'
}
