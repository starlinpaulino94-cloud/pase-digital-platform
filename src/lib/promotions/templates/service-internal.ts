/**
 * Internal service functions for template instantiation (Fase E3).
 *
 * These functions bridge the Promotion module to the Business Strategy Core,
 * allowing the "Plantillas" subsection UI to discover and instantiate templates
 * without directly depending on the core.
 *
 * @internal This file is for internal use only. User-facing code should not import from here.
 */

import { getBusinessStrategyCore } from '@/lib/business-strategy-core'
import type { TemplateMetadata, TemplateCatalogQuery } from '@/lib/business-strategy-core'

/**
 * Get the template catalog for promotions.
 * Used by the Plantillas subsection UI to display available templates.
 */
export function getPromotionTemplateCatalog(
  query?: TemplateCatalogQuery,
): readonly TemplateMetadata[] {
  const core = getBusinessStrategyCore()
  const library = core.getModuleLibrary('promotions')

  if (!library) {
    return []
  }

  return library.templates.list(query)
}

/**
 * Search promotion templates by term.
 */
export function searchPromotionTemplates(term: string): readonly TemplateMetadata[] {
  const core = getBusinessStrategyCore()
  const library = core.getModuleLibrary('promotions')

  if (!library) {
    return []
  }

  return library.templates.search(term)
}

/**
 * Get a single template by key.
 */
export function getPromotionTemplate(key: string): TemplateMetadata | null {
  const core = getBusinessStrategyCore()
  const library = core.getModuleLibrary('promotions')

  if (!library) {
    return null
  }

  return library.templates.get(key)
}
