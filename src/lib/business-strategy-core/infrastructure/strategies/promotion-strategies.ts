/**
 * Promotion Module Strategy Library (Fase E3).
 *
 * Combines promotion strategies + templates + instantiator into a single
 * ModuleStrategyLibrary that the Business Strategy Core registers.
 *
 * This is the INTERNAL interface — PromotionStrategy and carwash strategies
 * are moved here from @/lib/promotions/templates/. The Promotion module
 * no longer exports them publicly; instead, it calls the core when needed.
 */

import type {
  PromotionStrategy,
} from '@/lib/promotions/templates/strategy-types'
import type {
  TemplateCatalog,
  TemplateCatalogQuery,
  TemplateMetadata,
} from '../../domain/template-catalog'
import type {
  TemplateInstantiator,
  TemplateInstantiationContext,
  TemplateInstantiationResult,
} from '../../domain/template-instantiation'
import type { ModuleStrategyLibrary, StrategyCatalog } from '../../application/ports'
import { CARWASH_PROMOTION_STRATEGIES } from '@/lib/promotions/templates/carwash-strategies'
import { CARWASH_PROMOTION_TEMPLATES } from '@/lib/promotions/templates/carwash'
import { createPromotionService } from '@/lib/promotions'
import type { CreatePromotionData } from '@/lib/promotions'

/**
 * PromotionStrategyCatalog — registry of all promotion strategies.
 */
class PromotionStrategyCatalog implements StrategyCatalog<PromotionStrategy> {
  private strategies: readonly PromotionStrategy[]

  constructor() {
    this.strategies = CARWASH_PROMOTION_STRATEGIES
  }

  getAll(): readonly PromotionStrategy[] {
    return this.strategies
  }

  getById(id: string): PromotionStrategy | null {
    return this.strategies.find(s => s.id === id) ?? null
  }

  search(term: string): readonly PromotionStrategy[] {
    const lower = term.toLowerCase()
    return this.strategies.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.objective.toLowerCase().includes(lower),
    )
  }

  getByCategory(category: string): readonly PromotionStrategy[] {
    return this.strategies.filter(s => s.category === category)
  }
}

/**
 * PromotionTemplateCatalog — registry of all promotion templates.
 */
class PromotionTemplateCatalog implements TemplateCatalog {
  private templates: readonly TemplateMetadata[]

  constructor(strategies: readonly PromotionStrategy[]) {
    // Build metadata for each template
    const strategiesMap = new Map(strategies.map(s => [s.id, s]))

    this.templates = CARWASH_PROMOTION_TEMPLATES.map(template => {
      const strategy = strategiesMap.get(
        CARWASH_PROMOTION_STRATEGIES.find(s =>
          s.variantKeys.includes(template.key),
        )?.id ?? '',
      )

      return {
        key: template.key,
        strategyId: strategy?.id ?? 'unknown',
        strategyVersion: strategy?.version ?? '1.0.0',
        name: template.name,
        description: template.description,
        industry: template.industry,
        category: template.category,
        complexity: strategy?.complexity ?? 'media',
        useCase: strategy?.description,
        tags: strategy?.kpis?.slice(0, 3),
        updatedAt: new Date(),
        version: '1.0.0',
      }
    })
  }

  list(query?: TemplateCatalogQuery): readonly TemplateMetadata[] {
    let result = this.templates

    if (query?.industry) {
      result = result.filter(t => t.industry === query.industry)
    }

    if (query?.category) {
      result = result.filter(t => t.category === query.category)
    }

    if (query?.complexity) {
      result = result.filter(t => t.complexity === query.complexity)
    }

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term),
      )
    }

    return result
  }

  get(key: string): TemplateMetadata | null {
    return this.templates.find(t => t.key === key) ?? null
  }

  search(term: string): readonly TemplateMetadata[] {
    const lower = term.toLowerCase()
    return this.templates.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower),
    )
  }

  getStrategies(): readonly string[] {
    return Array.from(new Set(this.templates.map(t => t.strategyId)))
  }

  getCategories(): readonly string[] {
    return Array.from(new Set(
      this.templates.map(t => t.category).filter(Boolean),
    )) as string[]
  }
}

/**
 * PromotionTemplateInstantiator — creates new promotions from templates.
 */
class PromotionTemplateInstantiator implements TemplateInstantiator {
  async instantiate(
    context: TemplateInstantiationContext,
  ): Promise<TemplateInstantiationResult> {
    const template = CARWASH_PROMOTION_TEMPLATES.find(t => t.key === context.templateKey)
    if (!template) {
      throw new Error(`Template not found: ${context.templateKey}`)
    }

    const errors = await this.validate(context)
    if (errors.length > 0) {
      throw new Error(`Instantiation validation failed: ${errors.join('; ')}`)
    }

    const promotions = createPromotionService()

    const createData: CreatePromotionData = {
      companyId: context.companyId,
      name: template.name,
      description: template.description,
      createdById: context.createdById,
      config: {
        sourceStrategyId: context.templateKey,
        sourceTemplateKey: context.templateKey,
        ...context.overrides,
      },
      metadata: {
        instantiatedFrom: context.templateKey,
        instantiatedAt: new Date().toISOString(),
      },
    }

    const entity = await promotions.create(createData)

    // Find the strategy that contains this template
    const strategy = CARWASH_PROMOTION_STRATEGIES.find(s =>
      s.variantKeys.includes(context.templateKey),
    )

    return {
      entity,
      sourceStrategyId: strategy?.id ?? 'unknown',
      sourceStrategyVersion: strategy?.version ?? '1.0.0',
      sourceTemplateKey: context.templateKey,
    }
  }

  async validate(context: TemplateInstantiationContext): Promise<string[]> {
    const errors: string[] = []

    const template = CARWASH_PROMOTION_TEMPLATES.find(t => t.key === context.templateKey)
    if (!template) {
      errors.push(`Template not found: ${context.templateKey}`)
    }

    if (!context.companyId) {
      errors.push('companyId is required')
    }

    if (!context.createdById) {
      errors.push('createdById is required')
    }

    return errors
  }
}

/**
 * Create the Promotion Module Strategy Library.
 */
function createPromotionStrategyLibrary(): ModuleStrategyLibrary {
  const strategies = new PromotionStrategyCatalog()
  const templates = new PromotionTemplateCatalog(
    strategies.getAll() as PromotionStrategy[],
  )
  const instantiator = new PromotionTemplateInstantiator()

  return {
    moduleName: 'promotions',
    strategies,
    templates,
    instantiator,
  }
}

/** Singleton instance of the Promotion Module Strategy Library. */
export const promotionModuleLibrary = createPromotionStrategyLibrary()
