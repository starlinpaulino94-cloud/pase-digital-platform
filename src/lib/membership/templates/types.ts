/**
 * Plantillas de membresía (Fase A).
 *
 * Una plantilla es una configuración REUTILIZABLE por industria: define los
 * valores por defecto de un modelo comercial (precio sugerido, periodicidad,
 * créditos, límites, servicios…). Al instanciarla para una empresa se producen
 * los datos de `createPlan`, permitiendo overrides. Esto materializa el
 * principio de Fase 0: motor universal + plantilla de industria + configuración.
 */

import type { CreatePlanData } from '../application/ports'
import type {
  MembershipConfig,
  MembershipPeriodicity,
  MembershipPlanType,
} from '../domain/types'

export interface MembershipTemplate {
  /** Clave estable, ej. "carwash.unlimited_premium". */
  readonly key: string
  readonly industry: string
  readonly name: string
  readonly description: string
  readonly type: MembershipPlanType
  /** Nivel sugerido de despliegue: básico, avanzado o inteligente. */
  readonly tier: 'basic' | 'advanced' | 'smart'
  readonly suggestedPrice: number
  readonly currency: string
  readonly periodicity: MembershipPeriodicity
  readonly durationDays?: number | null
  readonly credits?: number | null
  readonly unlimited?: boolean
  readonly config: MembershipConfig
}

/** Overrides al instanciar una plantilla para una empresa concreta. */
export interface InstantiateOverrides {
  readonly name?: string
  readonly description?: string | null
  readonly price?: number
  readonly currency?: string
  readonly config?: Partial<MembershipConfig>
  readonly metadata?: Record<string, unknown>
}

/**
 * Convierte una plantilla + overrides en los datos para crear un plan de una
 * empresa. La configuración se fusiona (override superficial sobre config).
 */
export function instantiateTemplate(
  template: MembershipTemplate,
  companyId: string,
  overrides: InstantiateOverrides = {},
): CreatePlanData {
  return {
    companyId,
    name: overrides.name ?? template.name,
    description: overrides.description ?? template.description,
    type: template.type,
    price: overrides.price ?? template.suggestedPrice,
    currency: overrides.currency ?? template.currency,
    periodicity: template.periodicity,
    durationDays: template.durationDays ?? null,
    credits: template.credits ?? null,
    unlimited: template.unlimited ?? false,
    templateKey: template.key,
    config: { ...template.config, ...overrides.config },
    metadata: overrides.metadata ?? {},
  }
}
