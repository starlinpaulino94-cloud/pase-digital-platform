/**
 * Resolution Engine del Benefit Transformation Engine (Fase E1.7).
 *
 * Orquesta el pipeline de resolución: recorre las fuentes de fondeo registradas
 * en orden de prioridad hasta cubrir la diferencia económica. Los proveedores
 * de cada fuente se inyectan como dependencias — los motores pendientes
 * (Coupons, Points, Credits…) se conectarán cuando existan.
 */

import type { ResolutionSourceType, ResolutionResult, TransformationPolicyConfig } from '../domain/types'
import type { ResolutionContext, ResolutionSourceProvider } from '../domain/resolution'
import { runResolutionPipeline, DEFAULT_RESOLUTION_ORDER } from '../domain/resolution'
import { policyAllowsFunding } from '../domain/policy'

export interface ResolutionEngineOptions {
  readonly order?: readonly ResolutionSourceType[]
}

export class ResolutionEngine {
  private readonly providers = new Map<ResolutionSourceType, ResolutionSourceProvider>()
  private readonly order: readonly ResolutionSourceType[]

  constructor(options?: ResolutionEngineOptions) {
    this.order = options?.order ?? DEFAULT_RESOLUTION_ORDER
  }

  registerProvider(type: ResolutionSourceType, provider: ResolutionSourceProvider): void {
    this.providers.set(type, provider)
  }

  async resolve(
    ctx: ResolutionContext,
    policy?: TransformationPolicyConfig | null,
  ): Promise<ResolutionResult> {
    const funding = policyAllowsFunding(policy)

    const filteredOrder = this.order.filter(source => {
      switch (source) {
        case 'PAYMENT':       return funding.payment
        case 'POINTS':        return funding.points
        case 'CREDITS':       return funding.credits
        case 'COUPON':        return funding.coupons
        case 'PROMOTION':     return funding.promotions
        case 'CAMPAIGN':      return funding.promotions
        default:              return true
      }
    })

    return runResolutionPipeline(ctx, this.providers, filteredOrder)
  }
}
