/**
 * PrismaDictionaryRepository: adaptador del puerto DictionaryRepository.
 *
 * Persiste variables CUSTOM/por-empresa (el catálogo estándar vive en código).
 * Única pieza del diccionario que conoce Prisma.
 */

import type { Prisma, PrismaClient } from '@prisma/client'
import type { DataDefinition } from '../domain/types'
import type { DictionaryRepository } from '../application/ports'
import { mapVariable } from './mappers'

function toRow(def: DataDefinition) {
  return {
    companyId: def.companyId,
    key: def.key,
    displayName: def.displayName,
    description: def.description,
    semanticType: def.semanticType,
    category: def.category,
    subcategory: def.subcategory,
    ownerModule: def.ownerModule,
    source: def.source,
    contextPath: def.contextPath,
    format: def.format,
    unit: def.unit,
    aliases: [...def.aliases],
    status: def.status,
    version: def.version,
    validation: def.validation as Prisma.InputJsonValue,
    i18n: def.i18n as Prisma.InputJsonValue,
    calculated: (def.calculated ?? undefined) as Prisma.InputJsonValue | undefined,
    metadata: def.metadata as Prisma.InputJsonValue,
  }
}

export class PrismaDictionaryRepository implements DictionaryRepository {
  constructor(private readonly db: PrismaClient) {}

  async load(companyId?: string | null): Promise<DataDefinition[]> {
    const rows = await this.db.dataDictionaryVariable.findMany({
      where:
        companyId === undefined
          ? {}
          : { OR: [{ companyId: null }, { companyId }] },
    })
    return rows.map(mapVariable)
  }

  async findById(id: string): Promise<DataDefinition | null> {
    const row = await this.db.dataDictionaryVariable.findUnique({ where: { id } })
    return row ? mapVariable(row) : null
  }

  async save(def: DataDefinition): Promise<DataDefinition> {
    const row = await this.db.dataDictionaryVariable.create({
      data: { id: def.id, ...toRow(def) },
    })
    return mapVariable(row)
  }

  async update(def: DataDefinition): Promise<DataDefinition> {
    const row = await this.db.dataDictionaryVariable.update({
      where: { id: def.id },
      data: toRow(def),
    })
    return mapVariable(row)
  }

  async saveVersion(def: DataDefinition): Promise<void> {
    await this.db.dataDictionaryVariableVersion.create({
      data: {
        variableId: def.id,
        version: def.version,
        snapshot: def as unknown as Prisma.InputJsonValue,
      },
    })
  }
}
