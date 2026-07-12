/**
 * Internal service functions for template instantiation (Fase E3).
 *
 * These functions bridge the Membership module to the Business Strategy Core,
 * allowing the "Plantillas" subsection UI to discover and instantiate templates
 * without directly depending on the core.
 *
 * @internal This file is for internal use only. User-facing code should not import from here.
 */

import { getBusinessStrategyCore } from '@/lib/business-strategy-core'
import type { TemplateMetadata, TemplateCatalogQuery } from '@/lib/business-strategy-core'

/**
 * Get the template catalog for memberships.
 * Used by the Plantillas subsection UI to display available templates.
 */
export function getMembershipTemplateCatalog(
  query?: TemplateCatalogQuery,
): readonly TemplateMetadata[] {
  const core = getBusinessStrategyCore()
  const library = core.getModuleLibrary('membership')

  if (!library) {
    return []
  }

  return library.templates.list(query)
}

/**
 * Search membership templates by term.
 */
export function searchMembershipTemplates(term: string): readonly TemplateMetadata[] {
  const core = getBusinessStrategyCore()
  const library = core.getModuleLibrary('membership')

  if (!library) {
    return []
  }

  return library.templates.search(term)
}

/**
 * Get a single template by key.
 */
export function getMembershipTemplate(key: string): TemplateMetadata | null {
  const core = getBusinessStrategyCore()
  const library = core.getModuleLibrary('membership')

  if (!library) {
    return null
  }

  return library.templates.get(key)
}
