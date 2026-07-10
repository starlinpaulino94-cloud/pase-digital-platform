/**
 * Tipos de dominio del Business Data Dictionary (Fase 6).
 *
 * `DataDefinition` es la definición COMPLETA de una variable de negocio: su
 * identidad, tipo, categoría, origen, ruta en el Context Model, alias, i18n,
 * validaciones y —si es calculada— su descriptor. Nunca depende del ORM.
 */

import type { DataSource, SemanticType, VariableStatus } from './taxonomy'

/** Reglas de validación reutilizables por otros módulos. */
export interface ValidationRules {
  readonly requiredType?: boolean
  readonly requiredFormat?: boolean
  readonly min?: number
  readonly max?: number
  readonly minLength?: number
  readonly maxLength?: number
  readonly allowedValues?: readonly unknown[]
  readonly pattern?: string
}

/** Traducción/ayuda de una variable en un idioma. */
export interface I18nEntry {
  readonly name?: string
  readonly description?: string
  readonly help?: string
}

/** Diccionario de traducciones por locale, ej. { es: {...}, en: {...} }. */
export type I18n = Readonly<Record<string, I18nEntry>>

/**
 * Descriptor de una variable CALCULADA (no existe físicamente). Solo la
 * arquitectura: declara qué representa y de qué otras variables depende. El
 * cálculo real se implementará en una fase posterior.
 */
export interface CalculatedDescriptor {
  /** Identificador del cálculo, ej. "age", "count", "visits_last_month". */
  readonly kind: string
  /** Ids de variables del diccionario de las que depende. */
  readonly inputs?: readonly string[]
  /** Notas/observaciones del cálculo (sin fórmula todavía). */
  readonly notes?: string
}

/** Metadatos ampliables de la variable (documentación automática futura). */
export interface VariableMetadata {
  readonly functionalDescription?: string
  readonly usageExamples?: readonly string[]
  readonly defaultValue?: unknown
  readonly expectedFormat?: string
  readonly observations?: string
  readonly technicalDocs?: string
  readonly [extra: string]: unknown
}

/** Definición completa de una variable del diccionario. */
export interface DataDefinition {
  readonly id: string
  /** Nombre técnico único (por empresa/global), ej. "cliente.puntos". */
  readonly key: string
  readonly displayName: string
  readonly description: string | null
  readonly semanticType: SemanticType
  readonly category: string
  readonly subcategory: string | null
  readonly ownerModule: string | null
  readonly source: DataSource
  /** Ruta en el Modelo Universal de Contexto, ej. "cliente.puntos". */
  readonly contextPath: string | null
  readonly format: string | null
  readonly unit: string | null
  readonly aliases: readonly string[]
  readonly status: VariableStatus
  readonly version: number
  /** null = variable global/estándar; con valor = específica de empresa. */
  readonly companyId: string | null
  readonly validation: ValidationRules
  readonly i18n: I18n
  readonly calculated: CalculatedDescriptor | null
  readonly metadata: VariableMetadata
}

/** Datos para registrar una variable (id/version los asigna el sistema). */
export type RegisterVariableInput = Omit<
  DataDefinition,
  'id' | 'version' | 'status'
> & {
  readonly status?: VariableStatus
}

/** Parche parcial para actualizar una variable. */
export type UpdateVariableInput = Partial<
  Omit<DataDefinition, 'id' | 'key' | 'companyId' | 'version'>
>

/** Criterios de búsqueda/descubrimiento. */
export interface VariableQuery {
  readonly category?: string
  readonly module?: string
  readonly semanticType?: SemanticType
  readonly source?: DataSource
  readonly status?: VariableStatus
  readonly companyId?: string | null
  /** Texto libre: busca en key, displayName, descripción y alias. */
  readonly text?: string
}
