/**
 * Automation Playbooks (Fase E1.1+). Un Playbook es una estrategia comercial
 * profesional lista para instalar: una automatización del Automation Engine
 * (E1) ENVUELTA con la documentación completa que exige el Documento Maestro
 * (24 apartados). No duplica lógica: el `config` es una AutomationConfig real y
 * se instala con `instantiateAutomationTemplate`.
 *
 * Universal por diseño: cada Playbook declara con qué industrias es compatible.
 * Car Wash es solo la primera que las usa.
 */

import type { CreateAutomationData } from '../application/ports'
import type { AutomationConfig } from '../domain/types'
import { instantiateAutomationTemplate, type InstantiateAutomationOverrides } from '../templates/types'

/** Industrias objetivo (universal = cualquiera). */
export const INDUSTRIES = {
  UNIVERSAL: 'universal',
  CARWASH: 'carwash',
  RESTAURANT: 'restaurante',
  GYM: 'gimnasio',
  SALON: 'salon',
  VET: 'veterinaria',
  HOTEL: 'hotel',
  CLINIC: 'clinica',
  RETAIL: 'retail',
  DEALER: 'dealer',
} as const

export type IndustryKey = (typeof INDUSTRIES)[keyof typeof INDUSTRIES]

/** Motores de la Strategy Library que un Playbook puede reutilizar. */
export type EngineRef =
  | 'rule'
  | 'action'
  | 'promotion'
  | 'membership'
  | 'benefit'
  | 'reward'
  | 'referral'
  | 'campaign'
  | 'gamification'
  | 'analytics'
  | 'template'

export type PlaybookComplexity = 'basic' | 'intermediate' | 'advanced'

/** Categoría del Playbook (E1.1 = captación; futuras fases añaden más). */
export type PlaybookCategory =
  | 'captacion'
  | 'onboarding'
  | 'primera_compra'
  | 'frecuencia'
  | 'recuperacion'
  | 'membresias'
  | 'referidos'
  | 'campanas'
  | 'gamificacion'
  | 'ia'

/**
 * Estructura COMPLETA del Playbook (los 24 apartados del documento). Los campos
 * descriptivos son texto/listas; `config` es la automatización instalable.
 */
export interface AutomationPlaybook {
  /** Automation ID (ej. "ACQ-001"). */
  readonly id: string
  readonly name: string
  readonly category: PlaybookCategory
  /** Objetivo comercial. */
  readonly objective: string
  /** Problema que resuelve. */
  readonly problem: string
  /** Cuándo utilizarla. */
  readonly whenToUse: string
  readonly complexity: PlaybookComplexity
  /** Industrias compatibles (incluye 'universal' cuando aplica a cualquiera). */
  readonly industries: readonly IndustryKey[]
  /** Triggers (resumen legible; el real está en `config.trigger`). */
  readonly triggers: readonly string[]
  /** Condiciones (resumen legible; las reales están en los pasos como BEL). */
  readonly conditions: readonly string[]
  /** Variables utilizadas (claves del catálogo). */
  readonly variables: readonly string[]
  /** Motores involucrados. */
  readonly engines: readonly EngineRef[]
  /** Flujo completo (pasos legibles). */
  readonly flow: readonly string[]
  /** Acciones (tipos del Action Engine). */
  readonly actions: readonly string[]
  /** Esperas del flujo (resumen legible; las reales están en `config.steps[].wait`). */
  readonly esperas?: readonly string[]
  /** Eventos generados. */
  readonly events: readonly string[]
  /** Excepciones / casos a considerar. */
  readonly exceptions: readonly string[]
  /** Configuraciones editables por la empresa. */
  readonly editable: readonly string[]
  /** Beneficios compatibles (códigos del Benefit Engine). */
  readonly compatibleBenefits: readonly string[]
  /** Promociones compatibles (códigos/objetivos del Promotion Engine). */
  readonly compatiblePromotions: readonly string[]
  /** Campañas compatibles. */
  readonly compatibleCampaigns: readonly string[]
  /** KPIs a seguir. */
  readonly kpis: readonly string[]
  /** Dependencias (qué debe existir para funcionar). */
  readonly dependencies: readonly string[]
  /** Plantillas compatibles (otras plantillas que combinan bien). */
  readonly compatibleTemplates: readonly string[]
  /** Ejemplos de uso. */
  readonly examples: readonly string[]
  /** Notas técnicas. */
  readonly notes: string
  /** Automatización instalable (config real del Automation Engine). */
  readonly config: AutomationConfig
}

/** Convierte un Playbook en los datos para crear la automatización (reusa E1). */
export function playbookToCreateData(
  playbook: AutomationPlaybook,
  companyId: string,
  overrides: InstantiateAutomationOverrides = {},
): CreateAutomationData {
  return instantiateAutomationTemplate(
    {
      key: `playbook.${playbook.id}`,
      name: playbook.name,
      description: playbook.problem,
      objective: playbook.objective,
      category: playbook.category,
      config: playbook.config,
    },
    companyId,
    {
      ...overrides,
      metadata: {
        playbookId: playbook.id,
        category: playbook.category,
        industries: playbook.industries,
        engines: playbook.engines,
        ...overrides.metadata,
      },
    },
  )
}

/** ¿El Playbook es compatible con una industria? (universal = siempre). */
export function isCompatibleWith(playbook: AutomationPlaybook, industry: IndustryKey): boolean {
  return (
    playbook.industries.includes(INDUSTRIES.UNIVERSAL) ||
    playbook.industries.includes(industry)
  )
}
