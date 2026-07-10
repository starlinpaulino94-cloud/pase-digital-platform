/**
 * DictionaryService: API interna del Business Data Dictionary (Fase 6).
 *
 * Combina el catálogo ESTÁNDAR (código) con las variables persistidas (repo) en
 * un `Dictionary` indexado, y expone las operaciones oficiales: registrar,
 * actualizar, versionar, buscar, resolver alias, consultar categorías/tipos y
 * obtener documentación. Sin lógica de negocio.
 */

import { randomUUID } from 'node:crypto'
import { Dictionary } from '../domain/dictionary'
import { STANDARD_CATALOG } from '../domain/catalog'
import { isSemanticType, type SemanticType } from '../domain/taxonomy'
import type {
  DataDefinition,
  RegisterVariableInput,
  UpdateVariableInput,
  VariableQuery,
} from '../domain/types'
import type { DictionaryRepository } from './ports'

export class DictionaryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DictionaryError'
  }
}

/** Documentación consolidada de una variable (para ayuda/autocompletado). */
export interface VariableDocumentation {
  readonly definition: DataDefinition
  readonly i18n: DataDefinition['i18n']
  readonly validation: DataDefinition['validation']
  readonly metadata: DataDefinition['metadata']
  readonly calculated: DataDefinition['calculated']
}

export class DictionaryService {
  private readonly dictionary = new Dictionary()

  constructor(private readonly repo?: DictionaryRepository) {
    // Siembra el catálogo estándar; el repo (si existe) se fusiona con load().
    this.dictionary.registerAll(STANDARD_CATALOG)
  }

  /** Fusiona las variables persistidas (custom/por-empresa) en el diccionario. */
  async load(companyId?: string | null): Promise<void> {
    if (!this.repo) return
    const persisted = await this.repo.load(companyId ?? null)
    this.dictionary.registerAll(persisted)
  }

  // ── Consulta / descubrimiento ─────────────────────────────────────────────

  /** Diccionario indexado subyacente (para el puente con el Rule Engine). */
  catalog(): Dictionary {
    return this.dictionary
  }

  get(id: string): DataDefinition | undefined {
    return this.dictionary.get(id)
  }

  getByKey(key: string): DataDefinition | undefined {
    return this.dictionary.getByKey(key)
  }

  /** Resuelve una clave o alias a su definición oficial. */
  resolveAlias(name: string): DataDefinition | undefined {
    return this.dictionary.resolveAlias(name)
  }

  search(query: VariableQuery = {}): DataDefinition[] {
    return this.dictionary.search(query)
  }

  categories(): string[] {
    return this.dictionary.categories()
  }

  semanticTypes(): SemanticType[] {
    return this.dictionary.semanticTypes()
  }

  modules(): string[] {
    return this.dictionary.modules()
  }

  /** Documentación consolidada de una variable. */
  documentation(id: string): VariableDocumentation | undefined {
    const def = this.dictionary.get(id)
    if (!def) return undefined
    return {
      definition: def,
      i18n: def.i18n,
      validation: def.validation,
      metadata: def.metadata,
      calculated: def.calculated,
    }
  }

  // ── Registro / actualización / versionado ─────────────────────────────────

  /** Registra una variable nueva (validando su definición) y la persiste. */
  async register(input: RegisterVariableInput): Promise<DataDefinition> {
    this.assertValidDefinition(input)
    const def: DataDefinition = {
      ...input,
      id: randomUUID(),
      version: 1,
      status: input.status ?? 'ACTIVE',
    }
    if (this.repo) await this.repo.save(def)
    this.dictionary.register(def)
    return def
  }

  /** Actualiza una variable existente. */
  async update(id: string, patch: UpdateVariableInput): Promise<DataDefinition> {
    const current = this.dictionary.get(id)
    if (!current) throw new DictionaryError(`Variable no encontrada: ${id}`)
    const updated: DataDefinition = { ...current, ...patch }
    this.assertValidDefinition(updated)
    if (this.repo) await this.repo.update(updated)
    this.dictionary.register(updated)
    return updated
  }

  /** Congela la versión actual como historial e incrementa la versión. */
  async version(id: string): Promise<DataDefinition> {
    const current = this.dictionary.get(id)
    if (!current) throw new DictionaryError(`Variable no encontrada: ${id}`)
    if (this.repo) await this.repo.saveVersion(current)
    const bumped: DataDefinition = { ...current, version: current.version + 1 }
    if (this.repo) await this.repo.update(bumped)
    this.dictionary.register(bumped)
    return bumped
  }

  /** Marca una variable como desactivada (no se resolverá para nuevas reglas). */
  async disable(id: string): Promise<DataDefinition> {
    return this.update(id, { status: 'DISABLED' })
  }

  private assertValidDefinition(def: {
    key: string
    semanticType: SemanticType
    validation?: { pattern?: string }
  }): void {
    if (!def.key || def.key.trim() === '') throw new DictionaryError('La clave (key) es obligatoria.')
    if (!isSemanticType(def.semanticType)) throw new DictionaryError(`Tipo semántico inválido: ${def.semanticType}.`)
    if (def.validation?.pattern) {
      try {
        new RegExp(def.validation.pattern)
      } catch {
        throw new DictionaryError(`Patrón de validación inválido: ${def.validation.pattern}.`)
      }
    }
  }
}
