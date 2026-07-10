/**
 * Puertos del Business Data Dictionary (Fase 6).
 *
 * El servicio depende de estas abstracciones, no de Prisma. El repositorio
 * persiste las variables CUSTOM/por-empresa; el catálogo estándar vive en código.
 */

import type { DataDefinition } from '../domain/types'

export interface DictionaryRepository {
  /** Carga las variables persistidas (globales custom + de una empresa si se indica). */
  load(companyId?: string | null): Promise<DataDefinition[]>
  findById(id: string): Promise<DataDefinition | null>
  save(def: DataDefinition): Promise<DataDefinition>
  update(def: DataDefinition): Promise<DataDefinition>
  saveVersion(def: DataDefinition): Promise<void>
}
