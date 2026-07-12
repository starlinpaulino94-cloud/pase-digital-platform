/**
 * Template Instantiation Domain (Fase E3).
 *
 * Logic for creating a new entity (promotion, membership, etc.) from a template.
 * Crucially: templates are NEVER modified. Instead, a new entity is created with:
 * - Fresh ID (unique to this company/tenant)
 * - Copied configuration from the template
 * - DRAFT status (not live)
 * - Reference to the source strategy (for tracking, but hidden from user)
 */

export interface TemplateInstantiationContext {
  /** Template key to instantiate from. */
  templateKey: string

  /** Company ID that owns the new entity. */
  companyId: string

  /** User ID creating the entity. */
  createdById: string

  /** Optional overrides to merge with template config. */
  overrides?: Record<string, unknown>
}

export interface TemplateInstantiationResult<T = unknown> {
  /** Newly created entity with fresh ID, DRAFT status, copied config. */
  entity: T

  /** Source strategy ID (for tracking provenance, internal only). */
  sourceStrategyId: string

  /** Source strategy version. */
  sourceStrategyVersion: string

  /** Source template key. */
  sourceTemplateKey: string
}

/**
 * Template Instantiation Service — creates new entities from templates.
 * Implementations per module: PromotionInstantiator, MembershipInstantiator, etc.
 */
export interface TemplateInstantiator<T = unknown> {
  /**
   * Instantiate a template: create a new entity with fresh ID, DRAFT status,
   * copied config from the template, and optional overrides.
   *
   * The returned entity is READY TO EDIT but not yet published.
   */
  instantiate(context: TemplateInstantiationContext): Promise<TemplateInstantiationResult<T>>

  /**
   * Validate that a template can be instantiated in this context.
   * Returns validation errors if any.
   */
  validate(context: TemplateInstantiationContext): Promise<string[]>
}

/**
 * Generates a unique entity ID for the instantiated copy.
 * Default implementation: slug-based, but can be overridden per module.
 */
export function generateInstantiatedId(templateKey: string, companyId: string): string {
  const timestamp = Date.now().toString(36)
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `inst_${templateKey.replace(/\./g, '_')}_${companyId.substring(0, 4)}_${timestamp}${randomSuffix}`
}
