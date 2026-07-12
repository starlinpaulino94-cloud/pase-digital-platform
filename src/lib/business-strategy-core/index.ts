/**
 * Business Strategy Core (Fase E3) — INTERNAL API.
 *
 * This module is NOT part of the user-facing interface. It provides internal
 * capabilities for:
 * 1. Strategy Library management (discovery of business strategies)
 * 2. Template Catalog (browsable templates per module)
 * 3. Template Instantiation (create entities from templates)
 *
 * The Business Strategy Core is initialized at application startup with module
 * libraries and made available to API routes that need to instantiate templates.
 *
 * User-facing code NEVER imports from this module; instead, modules like
 * @/lib/promotions expose helper functions like instantiateTemplate() that
 * delegate to the core internally.
 *
 * @internal This is platform infrastructure, not part of the public API.
 */

import { createBusinessStrategyCore } from './application/business-strategy-core-service'
import { promotionModuleLibrary } from './infrastructure/strategies/promotion-strategies'
import { membershipModuleLibrary } from './infrastructure/strategies/membership-strategies'

// Re-exports (internal use only)
export type { StrategyDescriptor } from './domain/strategy-descriptor'
export { validateStrategyDescriptor } from './domain/strategy-descriptor'
export type {
  TemplateMetadata,
  TemplateCatalog,
  TemplateCatalogQuery,
} from './domain/template-catalog'
export type {
  TemplateInstantiationContext,
  TemplateInstantiationResult,
  TemplateInstantiator,
} from './domain/template-instantiation'
export type {
  BusinessStrategyCore,
  ModuleStrategyLibrary,
  StrategyCatalog,
} from './application/ports'
export { createBusinessStrategyCore } from './application/business-strategy-core-service'

// Singleton instance — initialized at platform startup
const businessStrategyCore = createBusinessStrategyCore([
  promotionModuleLibrary,
  membershipModuleLibrary,
  // Additional module libraries would be registered here:
  // benefitModuleLibrary,
  // referralModuleLibrary,
  // campaignModuleLibrary,
  // automationModuleLibrary,
  // gamificationModuleLibrary,
])

export function getBusinessStrategyCore() {
  return businessStrategyCore
}
