/**
 * Membership Module Strategy Library (Fase E3).
 *
 * Combines membership strategies + templates + instantiator into a single
 * ModuleStrategyLibrary that the Business Strategy Core registers.
 */

import type { ModuleStrategyLibrary, StrategyCatalog } from '../../application/ports'
import type {
  TemplateCatalog,
  TemplateMetadata,
  TemplateCatalogQuery,
} from '../../domain/template-catalog'
import type {
  TemplateInstantiator,
  TemplateInstantiationContext,
  TemplateInstantiationResult,
} from '../../domain/template-instantiation'
import type { MembershipStrategy } from '@/lib/membership/templates/strategy-types'
import { CARWASH_MEMBERSHIP_STRATEGIES } from '@/lib/membership/templates/carwash-strategies'
import { CARWASH_MEMBERSHIP_TEMPLATES } from '@/lib/membership/templates/carwash'
import { createMembershipService } from '@/lib/membership'
import type { CreatePlanData } from '@/lib/membership'

/**
 * MembershipStrategyCatalog — registry of all membership strategies.
 */
class MembershipStrategyCatalog implements StrategyCatalog<MembershipStrategy> {
  private strategies: readonly MembershipStrategy[]

  constructor() {
    this.strategies = CARWASH_MEMBERSHIP_STRATEGIES
  }

  getAll(): readonly MembershipStrategy[] {
    return this.strategies
  }

  getById(id: string): MembershipStrategy | null {
    return this.strategies.find(s => s.id === id) ?? null
  }

  search(term: string): readonly MembershipStrategy[] {
    const lower = term.toLowerCase()
    return this.strategies.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.objective.some(obj => obj.toLowerCase().includes(lower)),
    )
  }

  getByCategory(category: string): readonly MembershipStrategy[] {
    return this.strategies.filter(s => s.model === category)
  }
}

/**
 * MembershipTemplateCatalog — registry of all membership templates.
 */
class MembershipTemplateCatalog implements TemplateCatalog {
  private templates: readonly TemplateMetadata[]

  constructor(strategies: readonly MembershipStrategy[]) {
    const strategiesMap = new Map(strategies.map(s => [s.id, s]))

    this.templates = CARWASH_MEMBERSHIP_TEMPLATES.map(template => {
      const strategy = strategiesMap.get(
        CARWASH_MEMBERSHIP_STRATEGIES.find(s =>
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
        category: strategy?.model,
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
 * MembershipTemplateInstantiator — creates new memberships from templates.
 */
class MembershipTemplateInstantiator implements TemplateInstantiator {
  async instantiate(
    context: TemplateInstantiationContext,
  ): Promise<TemplateInstantiationResult> {
    const template = CARWASH_MEMBERSHIP_TEMPLATES.find(t => t.key === context.templateKey)
    if (!template) {
      throw new Error(`Template not found: ${context.templateKey}`)
    }

    const errors = await this.validate(context)
    if (errors.length > 0) {
      throw new Error(`Instantiation validation failed: ${errors.join('; ')}`)
    }

    const memberships = createMembershipService()

    const createData: CreatePlanData = {
      companyId: context.companyId,
      name: template.name,
      description: template.description,
      type: template.type,
      price: template.suggestedPrice,
      currency: template.currency,
      periodicity: template.periodicity,
      durationDays: template.durationDays,
      credits: template.credits,
      unlimited: template.unlimited,
      templateKey: context.templateKey,
      config: {
        sourceStrategyId: context.templateKey,
        sourceTemplateKey: context.templateKey,
        ...(template.config as Record<string, unknown>),
        ...context.overrides,
      },
      metadata: {
        instantiatedFrom: context.templateKey,
        instantiatedAt: new Date().toISOString(),
      },
    }

    const entity = await memberships.createPlan(createData)

    const strategy = CARWASH_MEMBERSHIP_STRATEGIES.find(s =>
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

    const template = CARWASH_MEMBERSHIP_TEMPLATES.find(t => t.key === context.templateKey)
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
 * Create the Membership Module Strategy Library.
 */
function createMembershipStrategyLibrary(): ModuleStrategyLibrary {
  const strategies = new MembershipStrategyCatalog()
  const templates = new MembershipTemplateCatalog(
    strategies.getAll() as MembershipStrategy[],
  )
  const instantiator = new MembershipTemplateInstantiator()

  return {
    moduleName: 'membership',
    strategies,
    templates,
    instantiator,
  }
}

/** Singleton instance of the Membership Module Strategy Library. */
export const membershipModuleLibrary = createMembershipStrategyLibrary()
