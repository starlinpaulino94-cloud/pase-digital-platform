/**
 * Template Catalog Domain (Fase E3).
 *
 * Metadata for discovering and filtering templates within a module.
 * Templates are readonly master copies that live in the Business Strategy Core.
 * When a user creates from a template, it is COPIED (instantiated) with a new ID.
 */

export interface TemplateMetadata {
  /** Template key, e.g. "carwash.promotion.CAR-001". */
  readonly key: string

  /** Strategy ID this template materializes, e.g. "carwash.promo.captacion". */
  readonly strategyId: string

  /** Strategy version this template targets. */
  readonly strategyVersion: string

  /** Human-readable template name. */
  readonly name: string

  /** One-line description. */
  readonly description: string

  /** Industry/vertical, e.g. "carwash". */
  readonly industry: string

  /** Category or objective (strategy-specific), e.g. "Captación". */
  readonly category?: string

  /** Complexity of this template: 'baja' | 'media' | 'alta'. */
  readonly complexity: 'baja' | 'media' | 'alta'

  /** Recommended use case. */
  readonly useCase?: string

  /** Tags for filtering/search. */
  readonly tags?: readonly string[]

  /** When this template was last updated. */
  readonly updatedAt: Date

  /** Semantic version of the template. */
  readonly version: string
}

/**
 * Query options for template discovery.
 */
export interface TemplateCatalogQuery {
  industry?: string
  category?: string
  complexity?: 'baja' | 'media' | 'alta'
  strategyId?: string
  tags?: readonly string[]
  search?: string
}

/**
 * Template Catalog — read-only listing of all templates in a module.
 * Implementations per module: PromotionTemplateCatalog, MembershipTemplateCatalog, etc.
 */
export interface TemplateCatalog {
  /** Get all templates, optionally filtered. */
  list(query?: TemplateCatalogQuery): readonly TemplateMetadata[]

  /** Get a single template by key. */
  get(key: string): TemplateMetadata | null

  /** Search templates by text (name + description). */
  search(term: string): readonly TemplateMetadata[]

  /** Get all strategies this catalog covers. */
  getStrategies(): readonly string[]

  /** Get all categories in this catalog. */
  getCategories(): readonly string[]
}
