/**
 * Puente Benefit → Action Engine (Fase C ↔ F3). Traduce un beneficio a una o
 * más acciones ejecutables del catálogo universal de acciones. Así el Benefit
 * Engine no ejecuta nada por su cuenta: describe QUÉ entregar y el Action
 * Engine sabe CÓMO aplicarlo, igual que el puente de promociones (Fase B).
 */

import { ACTION_TYPES, type ActionTypeKey } from '@/lib/rule-engine'
import type { Benefit } from './types'

export interface BenefitActionSpec {
  readonly type: ActionTypeKey
  readonly params: Readonly<Record<string, unknown>>
}

/**
 * Convierte un beneficio en las acciones que lo materializan. Un beneficio de
 * tipo desconocido/CUSTOM cae en `apply_benefit` genérico con su config, para
 * que la empresa lo maneje sin romper el motor (Open/Closed).
 */
export function benefitToActions(benefit: Benefit): readonly BenefitActionSpec[] {
  const c = benefit.config
  const qty = c.quantity ?? 1

  switch (benefit.type) {
    case 'DISCOUNT':
      return c.discountKind === 'FIXED'
        ? [{ type: ACTION_TYPES.APPLY_DISCOUNT_FIXED, params: { amount: c.value ?? 0 } }]
        : [{ type: ACTION_TYPES.APPLY_DISCOUNT_PERCENT, params: { percent: c.value ?? 0 } }]

    case 'SERVICE_FREE':
      return [{
        type: ACTION_TYPES.APPLY_BENEFIT,
        params: { kind: 'free_service', service: c.service ?? null, quantity: qty },
      }]

    case 'UPGRADE':
      return [{
        type: ACTION_TYPES.APPLY_BENEFIT,
        params: { kind: 'upgrade', fromService: c.fromService ?? null, service: c.service ?? null },
      }]

    case 'PRODUCT':
      return [{
        type: ACTION_TYPES.APPLY_BENEFIT,
        params: { kind: 'product', product: c.product ?? null, quantity: qty },
      }]

    case 'POINTS':
      return [{
        type: ACTION_TYPES.ADD_POINTS,
        params: { points: c.value ?? 0, multiplier: c.multiplier ?? 1 },
      }]

    case 'CREDIT':
      return [{ type: ACTION_TYPES.ADD_CREDITS, params: { amount: c.value ?? 0 } }]

    case 'TIME':
      return [{
        type: ACTION_TYPES.APPLY_BENEFIT,
        params: { kind: 'time', unit: c.timeUnit ?? 'DAYS', quantity: qty },
      }]

    case 'EXPERIENCE':
      return [{
        type: ACTION_TYPES.APPLY_BENEFIT,
        params: { kind: 'experience', service: c.service ?? null },
      }]

    case 'ACCESS':
      return [{
        type: ACTION_TYPES.APPLY_BENEFIT,
        params: { kind: 'access', service: c.service ?? null },
      }]

    case 'CUSTOM':
    default:
      return [{
        type: ACTION_TYPES.APPLY_BENEFIT,
        params: { kind: 'custom', code: benefit.code ?? null, config: c },
      }]
  }
}
