/**
 * Plantillas de beneficio (Fase C).
 *
 * Una plantilla es un beneficio REUTILIZABLE por industria: define valores por
 * defecto (tipo, categoría, valor percibido, costo real, config) que la empresa
 * puede instanciar y luego editar. Materializa el principio de Fase 0: motor
 * universal + plantilla de industria + configuración editable.
 */

import type { CreateBenefitData } from '../application/ports'
import type { BenefitConfig, BenefitType } from '../domain/types'

export interface BenefitTemplate {
  /** Clave estable, ej. "carwash.CAR-001". */
  readonly key: string
  /** Código de la biblioteca, ej. "CAR-001". */
  readonly code: string
  readonly industry: string
  readonly name: string
  readonly description: string
  /** Categoría de la biblioteca (clave de BENEFIT_CATEGORIES). */
  readonly category: string
  readonly type: BenefitType
  /** Valor percibido sugerido (lo que el cliente cree que vale). */
  readonly perceivedValue?: number
  /** Costo real sugerido (lo que le cuesta al negocio). */
  readonly realCost?: number
  readonly config?: BenefitConfig
}

/** Overrides al instanciar una plantilla para una empresa concreta. */
export interface InstantiateBenefitOverrides {
  readonly name?: string
  readonly description?: string | null
  readonly perceivedValue?: number | null
  readonly realCost?: number | null
  readonly config?: Partial<BenefitConfig>
  readonly metadata?: Record<string, unknown>
}

/**
 * Convierte una plantilla + overrides en los datos para crear un beneficio de
 * una empresa. La configuración se fusiona (override superficial sobre config).
 */
export function instantiateBenefitTemplate(
  template: BenefitTemplate,
  companyId: string,
  overrides: InstantiateBenefitOverrides = {},
): CreateBenefitData {
  return {
    companyId,
    code: template.code,
    name: overrides.name ?? template.name,
    description: overrides.description ?? template.description,
    category: template.category,
    type: template.type,
    perceivedValue: overrides.perceivedValue ?? template.perceivedValue ?? null,
    realCost: overrides.realCost ?? template.realCost ?? null,
    templateKey: template.key,
    config: { ...template.config, ...overrides.config },
    metadata: overrides.metadata ?? { industry: template.industry },
  }
}
