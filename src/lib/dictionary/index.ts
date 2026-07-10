/**
 * Business Data Dictionary (Fase 6) — API pública y composition root.
 *
 * Fuente OFICIAL de todas las variables de negocio del ecosistema. El Rule
 * Engine (y cualquier módulo) consulta este diccionario en vez de acceder a
 * propiedades del ORM: cada condición referencia una variable del catálogo, que
 * se resuelve a su ruta en el Context Model y a su tipo.
 *
 * @example
 *   import { createDictionaryService, resolveConditionField } from '@/lib/dictionary'
 *   const dict = createDictionaryService()
 *   await dict.load(companyId)              // fusiona variables custom
 *   const v = dict.resolveAlias('customer.name')   // → cliente.nombre
 *   // Para el Rule Engine:
 *   // const spec = resolveConditionField(dict.catalog(), 'cliente.puntos')
 */

import { prisma } from '@/lib/prisma'
import { DictionaryService } from './application/dictionary-service'
import type { DictionaryRepository } from './application/ports'
import { PrismaDictionaryRepository } from './infrastructure/prisma-dictionary-repository'

export interface CreateDictionaryServiceOptions {
  /** Repositorio de persistencia. Por defecto: Prisma. Pasa `null` para solo-código. */
  repository?: DictionaryRepository | null
}

/** Composition root: servicio sembrado con el catálogo estándar (+ repo). */
export function createDictionaryService(
  options: CreateDictionaryServiceOptions = {},
): DictionaryService {
  const repository =
    options.repository === null
      ? undefined
      : (options.repository ?? new PrismaDictionaryRepository(prisma))
  return new DictionaryService(repository)
}

// ── Re-exports públicos ─────────────────────────────────────────────────────
// Dominio
export {
  SEMANTIC_TYPES,
  toRuleDataType,
  isSemanticType,
  DICTIONARY_CATEGORIES,
} from './domain/taxonomy'
export type {
  SemanticType,
  DataSource,
  VariableStatus,
  DictionaryCategory,
} from './domain/taxonomy'
export type {
  DataDefinition,
  ValidationRules,
  I18n,
  I18nEntry,
  CalculatedDescriptor,
  VariableMetadata,
  RegisterVariableInput,
  UpdateVariableInput,
  VariableQuery,
} from './domain/types'
export { Dictionary } from './domain/dictionary'
export { STANDARD_CATALOG } from './domain/catalog'
export { validateValue } from './domain/validation'
export type { ValidationIssue } from './domain/validation'

// Aplicación
export { DictionaryService, DictionaryError } from './application/dictionary-service'
export type { VariableDocumentation } from './application/dictionary-service'
export type { DictionaryRepository } from './application/ports'
export { resolveConditionField } from './application/rule-engine-bridge'
export type { ConditionFieldSpec, ResolveFieldResult } from './application/rule-engine-bridge'

// Infraestructura
export { PrismaDictionaryRepository } from './infrastructure/prisma-dictionary-repository'
export { mapVariable } from './infrastructure/mappers'
