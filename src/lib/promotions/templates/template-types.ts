/**
 * Sistema de plantillas de promoción (Fase B).
 *
 * Una PromotionTemplate es una estrategia comercial reutilizable por industria:
 * objetivo + segmento + trigger + condiciones (BEL) + beneficio + duración +
 * restricciones + canales + métricas. Al instanciarla se producen los datos para
 * el Promotion Framework (F4): un plan de promoción + sus acciones (Action
 * Engine, F3) + sus restricciones (F4). El beneficio se traduce a acciones; las
 * condiciones se guardan como expresiones BEL (F7) en la configuración.
 */

import { ACTION_TYPES } from '@/lib/rule-engine'
import type { CreatePromotionData } from '../application/ports'
import type { PromotionActionDef, PromotionRestrictionDef } from '../domain/types'
import type { RestrictionTypeKey } from '../domain/restrictions'
import {
  DEFAULT_PROMOTION_METRICS,
  type BenefitType,
  type PromotionChannel,
  type PromotionMetric,
  type PromotionObjective,
  type PromotionSegment,
  type TriggerType,
} from './taxonomy'

/** Beneficio que entrega la promoción. */
export interface BenefitSpec {
  readonly type: BenefitType
  /** Porcentaje, monto fijo, puntos o crédito según el tipo. */
  readonly value?: number
  /** Servicio para FREE_SERVICE/UPGRADE (ej. "lavado_premium"). */
  readonly service?: string
}

/** Disparador y sus parámetros (ej. inactividad de 30 días). */
export interface TriggerSpec {
  readonly type: TriggerType
  readonly params?: Readonly<Record<string, unknown>>
}

/** Restricción de la plantilla (mapea al catálogo de restricciones de F4). */
export interface TemplateRestriction {
  readonly type: RestrictionTypeKey
  readonly value?: number
}

/** Plantilla de promoción (estrategia comercial editable). */
export interface PromotionTemplate {
  readonly key: string // ej. "carwash.CAR-007"
  readonly code: string // ej. "CAR-007"
  readonly industry: string
  readonly name: string
  readonly objective: PromotionObjective
  /** Categoría de la biblioteca (agrupación del documento). */
  readonly category: string
  readonly description: string
  readonly segment: PromotionSegment
  readonly trigger: TriggerSpec
  /** Condición de elegibilidad como expresión BEL (opcional). */
  readonly conditions?: string
  readonly benefit: BenefitSpec
  readonly durationDays?: number
  readonly priority?: number
  readonly restrictions?: readonly TemplateRestriction[]
  readonly channels?: readonly PromotionChannel[]
  readonly metrics?: readonly PromotionMetric[]
}

/** Overrides al instanciar una plantilla para una empresa. */
export interface PromotionTemplateOverrides {
  readonly name?: string
  readonly description?: string
  readonly benefit?: Partial<BenefitSpec>
  readonly startsAt?: Date | null
  readonly endsAt?: Date | null
  readonly priority?: number
  readonly channels?: PromotionChannel[]
  readonly configExtra?: Record<string, unknown>
}

/** Resultado de instanciar: datos listos para el Promotion Framework. */
export interface InstantiatedPromotion {
  readonly create: CreatePromotionData
  readonly actions: Omit<PromotionActionDef, 'id'>[]
  readonly restrictions: Omit<PromotionRestrictionDef, 'id'>[]
}

/** Traduce un beneficio a una acción del Action Engine (F3). */
export function benefitToAction(benefit: BenefitSpec): Omit<PromotionActionDef, 'id'> {
  const base = { order: 0, required: true, maxRetries: 0, enabled: true, version: 1 }
  switch (benefit.type) {
    case 'porcentaje':
      return { ...base, type: ACTION_TYPES.APPLY_DISCOUNT_PERCENT, params: { percent: benefit.value ?? 0 } }
    case 'valor_fijo':
      return { ...base, type: ACTION_TYPES.APPLY_DISCOUNT_FIXED, params: { amount: benefit.value ?? 0 } }
    case 'servicio_gratis':
      return { ...base, type: ACTION_TYPES.APPLY_BENEFIT, params: { kind: 'free_service', service: benefit.service } }
    case 'upgrade':
      return { ...base, type: ACTION_TYPES.APPLY_BENEFIT, params: { kind: 'upgrade', service: benefit.service } }
    case 'puntos':
      return { ...base, type: ACTION_TYPES.ADD_POINTS, params: { points: benefit.value ?? 0 } }
    case 'credito':
      return { ...base, type: ACTION_TYPES.ADD_CREDITS, params: { amount: benefit.value ?? 0 } }
  }
}

/**
 * Convierte una plantilla + overrides en los datos del Promotion Framework.
 * El objetivo/segmento/trigger/beneficio/canales/métricas y las condiciones BEL
 * viven en `config` (sin columnas por caso).
 */
export function instantiatePromotionTemplate(
  template: PromotionTemplate,
  companyId: string,
  overrides: PromotionTemplateOverrides = {},
): InstantiatedPromotion {
  const benefit: BenefitSpec = { ...template.benefit, ...overrides.benefit }
  const metrics = template.metrics ?? DEFAULT_PROMOTION_METRICS

  const create: CreatePromotionData = {
    companyId,
    name: overrides.name ?? template.name,
    description: overrides.description ?? template.description,
    category: template.objective,
    priority: overrides.priority ?? template.priority ?? 0,
    startsAt: overrides.startsAt ?? null,
    endsAt: overrides.endsAt ?? null,
    config: {
      templateKey: template.key,
      code: template.code,
      objective: template.objective,
      libraryCategory: template.category,
      segment: template.segment,
      trigger: template.trigger,
      conditions: template.conditions ?? null,
      benefit,
      durationDays: template.durationDays ?? null,
      channels: overrides.channels ?? template.channels ?? [],
      metrics,
      ...overrides.configExtra,
    },
    metadata: { industry: template.industry },
  }

  const restrictions: Omit<PromotionRestrictionDef, 'id'>[] = (template.restrictions ?? []).map((r) => ({
    type: r.type,
    value: r.value ?? null,
    config: {},
    enabled: true,
  }))

  return { create, actions: [benefitToAction(benefit)], restrictions }
}
