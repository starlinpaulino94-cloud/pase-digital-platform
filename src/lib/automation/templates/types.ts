/**
 * Plantillas de automatización (Fase E1). Una plantilla es una automatización
 * REUTILIZABLE por cualquier industria: define trigger + pasos por defecto que
 * la empresa instancia y edita. Las plantillas específicas por objetivo
 * (captación, onboarding, frecuencia…) llegan en E1.1–E1.10; aquí van las
 * UNIVERSALES base que validan el motor.
 */

import type { CreateAutomationData } from '../application/ports'
import type { AutomationConfig } from '../domain/types'

export interface AutomationTemplate {
  /** Clave estable, ej. "universal.cumpleanos". */
  readonly key: string
  readonly name: string
  readonly description: string
  readonly objective: string
  /** Categoría E1.x (captacion, onboarding, frecuencia, recuperacion…). */
  readonly category: string
  readonly config: AutomationConfig
}

/** Overrides al instanciar una plantilla para una empresa concreta. */
export interface InstantiateAutomationOverrides {
  readonly name?: string
  readonly description?: string | null
  readonly objective?: string | null
  readonly config?: Partial<AutomationConfig>
  readonly metadata?: Record<string, unknown>
}

/** Convierte una plantilla + overrides en los datos para crear una automatización. */
export function instantiateAutomationTemplate(
  template: AutomationTemplate,
  companyId: string,
  overrides: InstantiateAutomationOverrides = {},
): CreateAutomationData {
  const config: AutomationConfig = { ...template.config, ...overrides.config }
  return {
    companyId,
    name: overrides.name ?? template.name,
    description: overrides.description ?? template.description,
    objective: overrides.objective ?? template.objective,
    templateKey: template.key,
    triggerType: config.trigger.type,
    triggerEvent: config.trigger.event ?? null,
    config,
    metadata: overrides.metadata ?? { category: template.category },
  }
}
