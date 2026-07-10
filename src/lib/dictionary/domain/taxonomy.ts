/**
 * Taxonomía del Business Data Dictionary (Fase 6): tipos semánticos, categorías
 * y orígenes. Vocabulario de clasificación de las variables.
 *
 * Los TIPOS SEMÁNTICOS son ricos (Moneda, Porcentaje, Duración…) para el
 * formato/validación/UI, pero cada uno mapea a un `DataType` del Rule Engine
 * (Fase 2) para que la compatibilidad de operadores sea coherente y no se
 * permitan comparaciones incompatibles.
 */

import type { DataType } from '@/lib/rule-engine'

/** Tipo semántico de una variable (superconjunto del DataType del Rule Engine). */
export type SemanticType =
  | 'TEXT'
  | 'INTEGER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'LIST'
  | 'ENUM'
  | 'OBJECT'
  | 'JSON'
  | 'MONEY'
  | 'PERCENT'
  | 'DURATION'
  | 'COORDINATES'

export const SEMANTIC_TYPES: readonly SemanticType[] = [
  'TEXT', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'TIME', 'DATETIME',
  'LIST', 'ENUM', 'OBJECT', 'JSON', 'MONEY', 'PERCENT', 'DURATION', 'COORDINATES',
]

/**
 * Mapa tipo semántico → DataType del Rule Engine. Es la clave para que el motor
 * valide compatibilidad de operadores usando su propio sistema de tipos.
 */
const TO_DATA_TYPE: Record<SemanticType, DataType> = {
  TEXT: 'TEXT',
  INTEGER: 'NUMBER',
  DECIMAL: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  TIME: 'TIME',
  DATETIME: 'DATE',
  LIST: 'LIST',
  ENUM: 'ENUM',
  OBJECT: 'OBJECT',
  JSON: 'JSON',
  MONEY: 'NUMBER',
  PERCENT: 'NUMBER',
  DURATION: 'NUMBER',
  COORDINATES: 'OBJECT',
}

/** Traduce un tipo semántico al DataType que entiende el Rule Engine. */
export function toRuleDataType(semantic: SemanticType): DataType {
  return TO_DATA_TYPE[semantic]
}

export function isSemanticType(value: unknown): value is SemanticType {
  return typeof value === 'string' && (SEMANTIC_TYPES as readonly string[]).includes(value)
}

/** Origen del dato: de dónde proviene el valor de la variable. */
export type DataSource = 'CONTEXT' | 'CALCULATED' | 'CONSTANT' | 'EXTERNAL'

/** Estado de la variable. Espeja `DictionaryVariableStatus` de Prisma. */
export type VariableStatus = 'ACTIVE' | 'DEPRECATED' | 'DISABLED'

/**
 * Categorías iniciales del catálogo. Añadir una nueva es sumar aquí (o usar una
 * categoría libre): la arquitectura no cambia.
 */
export const DICTIONARY_CATEGORIES = {
  SISTEMA: 'Sistema',
  EMPRESA: 'Empresa',
  SUCURSAL: 'Sucursal',
  CLIENTE: 'Cliente',
  EMPLEADO: 'Empleado',
  USUARIO: 'Usuario',
  COMPRA: 'Compra',
  FACTURA: 'Factura',
  PAGO: 'Pago',
  PRODUCTO: 'Producto',
  CATEGORIA: 'Categoría',
  SERVICIO: 'Servicio',
  VEHICULO: 'Vehículo',
  RESERVA: 'Reserva',
  MESA: 'Mesa',
  HABITACION: 'Habitación',
  MASCOTA: 'Mascota',
  PACIENTE: 'Paciente',
  MEMBRESIA: 'Membresía',
  QR: 'QR',
  BENEFICIO: 'Beneficio',
  PROMOCION: 'Promoción',
  CAMPANA: 'Campaña',
  EVENTO: 'Evento',
  PUNTOS: 'Puntos',
  CREDITOS: 'Créditos',
  REFERIDOS: 'Referidos',
  DISPOSITIVO: 'Dispositivo',
  UBICACION: 'Ubicación',
  FECHA: 'Fecha',
  HORA: 'Hora',
  CALCULADAS: 'Variables Calculadas',
} as const

export type DictionaryCategory =
  (typeof DICTIONARY_CATEGORIES)[keyof typeof DICTIONARY_CATEGORIES]
