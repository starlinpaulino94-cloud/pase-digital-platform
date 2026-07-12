/**
 * Ports (interfaces) for Business Strategy Core services.
 *
 * These define contracts that each module must implement to work with
 * the core (Strategy Library, Template Catalog, Instantiator).
 */

import type { TemplateCatalog } from '../domain/template-catalog'
import type { TemplateInstantiator } from '../domain/template-instantiation'

/**
 * Strategy Catalog — registry of all strategies for a module.
 * Each module's catalog contains module-specific strategy types (e.g., PromotionStrategy, MembershipStrategy).
 * Module strategies may extend StrategyDescriptor with module-specific fields.
 */
export interface StrategyCatalog<T = unknown> {
  /** Get all strategies. */
  getAll(): readonly T[]

  /** Get strategy by ID. */
  getById(id: string): T | null

  /** Search strategies by text. */
  search(term: string): readonly T[]

  /** Get strategies by category. */
  getByCategory(category: string): readonly T[]
}

/**
 * Module-level Strategy Library — combines catalog + templates.
 */
export interface ModuleStrategyLibrary {
  /** Get module name (e.g., "promotions", "membership"). */
  readonly moduleName: string

  /** All strategies (internal, not user-facing). */
  readonly strategies: StrategyCatalog

  /** All templates (for instantiation). */
  readonly templates: TemplateCatalog

  /** Instantiate a template. */
  readonly instantiator: TemplateInstantiator
}

/**
 * Business Strategy Core — central registry of all module libraries.
 */
export interface BusinessStrategyCore {
  /** Get a module's strategy library. */
  getModuleLibrary(moduleName: string): ModuleStrategyLibrary | null

  /** List all registered modules. */
  listModules(): readonly string[]

  /** Cross-module search for strategies matching a goal. */
  searchStrategiesByGoal(goal: string): readonly Record<string, unknown>[]
}
