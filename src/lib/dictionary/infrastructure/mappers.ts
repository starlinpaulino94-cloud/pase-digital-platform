/**
 * Mappers Prisma ↔ dominio del Business Data Dictionary (Fase 6).
 */

import type { DataDictionaryVariable as PrismaVariable } from '@prisma/client'
import { isSemanticType, type DataSource, type SemanticType } from '../domain/taxonomy'
import type {
  CalculatedDescriptor,
  DataDefinition,
  I18n,
  ValidationRules,
  VariableMetadata,
} from '../domain/types'

const SOURCES: readonly DataSource[] = ['CONTEXT', 'CALCULATED', 'CONSTANT', 'EXTERNAL']

function toSource(raw: string): DataSource {
  return (SOURCES as readonly string[]).includes(raw) ? (raw as DataSource) : 'CONTEXT'
}

function toSemantic(raw: string): SemanticType {
  return isSemanticType(raw) ? raw : 'TEXT'
}

export function mapVariable(row: PrismaVariable): DataDefinition {
  return {
    id: row.id,
    key: row.key,
    displayName: row.displayName,
    description: row.description,
    semanticType: toSemantic(row.semanticType),
    category: row.category,
    subcategory: row.subcategory,
    ownerModule: row.ownerModule,
    source: toSource(row.source),
    contextPath: row.contextPath,
    format: row.format,
    unit: row.unit,
    aliases: row.aliases,
    status: row.status,
    version: row.version,
    companyId: row.companyId,
    validation: (row.validation ?? {}) as ValidationRules,
    i18n: (row.i18n ?? {}) as I18n,
    calculated: (row.calculated as CalculatedDescriptor | null) ?? null,
    metadata: (row.metadata ?? {}) as VariableMetadata,
  }
}
