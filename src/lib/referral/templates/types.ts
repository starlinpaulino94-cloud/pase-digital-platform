/**
 * Plantillas de programa de referidos (Fase D).
 *
 * Una plantilla es un programa REUTILIZABLE por industria: fija el modelo y una
 * configuración por defecto (recompensas, escalado, condiciones, límites,
 * antifraude, estados) que la empresa instancia y luego edita. Las recompensas
 * referencian beneficios del Benefit Engine (Fase C) por su código.
 */

import type { CreateProgramData } from '../application/ports'
import type { ReferralConfig, ReferralModel } from '../domain/types'

export interface ReferralProgramTemplate {
  /** Clave estable, ej. "carwash.ambos_ganan". */
  readonly key: string
  readonly industry: string
  readonly name: string
  readonly objective: string
  readonly type: ReferralModel
  /** Categoría de la biblioteca (captación, escalonadas, VIP, empresas, campañas). */
  readonly category: string
  readonly description: string
  readonly config: ReferralConfig
}

/** Overrides al instanciar una plantilla para una empresa concreta. */
export interface InstantiateProgramOverrides {
  readonly name?: string
  readonly objective?: string | null
  readonly config?: Partial<ReferralConfig>
  readonly metadata?: Record<string, unknown>
}

/**
 * Convierte una plantilla + overrides en los datos para crear un programa de
 * una empresa. La configuración se fusiona (override superficial sobre config).
 */
export function instantiateProgramTemplate(
  template: ReferralProgramTemplate,
  companyId: string,
  overrides: InstantiateProgramOverrides = {},
): CreateProgramData {
  return {
    companyId,
    name: overrides.name ?? template.name,
    objective: overrides.objective ?? template.objective,
    type: template.type,
    templateKey: template.key,
    config: { ...template.config, ...overrides.config },
    metadata: overrides.metadata ?? { industry: template.industry, category: template.category },
  }
}
