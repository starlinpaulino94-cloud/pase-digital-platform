/**
 * Dictionary (Fase 6): registro INDEXADO en memoria de variables de negocio.
 *
 * Es la fuente de consulta rápida del catálogo: mantiene índices por id, por
 * clave, por alias y por categoría para búsqueda/descubrimiento/autocompletado
 * sin recorrer toda la colección. Preparado para miles de variables.
 */

import type { DataDefinition, VariableQuery } from './types'
import type { SemanticType } from './taxonomy'

export class Dictionary {
  private readonly byId = new Map<string, DataDefinition>()
  private readonly byKey = new Map<string, DataDefinition>() // key en minúsculas
  private readonly byAlias = new Map<string, DataDefinition>() // alias/clave en minúsculas
  private readonly byCategory = new Map<string, Set<string>>() // categoría → ids

  /** Registra o reemplaza una variable, actualizando todos los índices. */
  register(def: DataDefinition): this {
    const previous = this.byId.get(def.id)
    if (previous) this.deindex(previous)
    this.byId.set(def.id, def)
    this.byKey.set(def.key.toLowerCase(), def)
    this.byAlias.set(def.key.toLowerCase(), def)
    for (const alias of def.aliases) this.byAlias.set(alias.toLowerCase(), def)
    if (!this.byCategory.has(def.category)) this.byCategory.set(def.category, new Set())
    this.byCategory.get(def.category)!.add(def.id)
    return this
  }

  /** Registra varias variables. */
  registerAll(defs: readonly DataDefinition[]): this {
    for (const def of defs) this.register(def)
    return this
  }

  get(id: string): DataDefinition | undefined {
    return this.byId.get(id)
  }

  getByKey(key: string): DataDefinition | undefined {
    return this.byKey.get(key.toLowerCase())
  }

  /** Resuelve un nombre (clave técnica O alias) a su definición. */
  resolveAlias(name: string): DataDefinition | undefined {
    return this.byAlias.get(name.toLowerCase())
  }

  has(id: string): boolean {
    return this.byId.has(id)
  }

  list(): DataDefinition[] {
    return [...this.byId.values()]
  }

  /** Categorías presentes en el catálogo. */
  categories(): string[] {
    return [...this.byCategory.keys()]
  }

  /** Tipos semánticos usados en el catálogo. */
  semanticTypes(): SemanticType[] {
    return [...new Set(this.list().map((d) => d.semanticType))]
  }

  /** Módulos propietarios presentes. */
  modules(): string[] {
    return [...new Set(this.list().map((d) => d.ownerModule).filter((m): m is string => !!m))]
  }

  /** Descubrimiento: filtra el catálogo por los criterios dados. */
  search(query: VariableQuery = {}): DataDefinition[] {
    const text = query.text?.toLowerCase().trim()
    return this.list().filter((d) => {
      if (query.category && d.category !== query.category) return false
      if (query.module && d.ownerModule !== query.module) return false
      if (query.semanticType && d.semanticType !== query.semanticType) return false
      if (query.source && d.source !== query.source) return false
      if (query.status && d.status !== query.status) return false
      if (query.companyId !== undefined && d.companyId !== query.companyId) return false
      if (text) {
        const haystack = [
          d.key, d.displayName, d.description ?? '', ...d.aliases,
        ].join(' ').toLowerCase()
        if (!haystack.includes(text)) return false
      }
      return true
    })
  }

  private deindex(def: DataDefinition): void {
    this.byKey.delete(def.key.toLowerCase())
    this.byAlias.delete(def.key.toLowerCase())
    for (const alias of def.aliases) this.byAlias.delete(alias.toLowerCase())
    this.byCategory.get(def.category)?.delete(def.id)
  }
}
