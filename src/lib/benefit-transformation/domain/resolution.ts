/**
 * Algoritmo de resolución del Benefit Transformation Engine.
 *
 * La resolución es un pipeline (waterfall) que recorre fuentes de fondeo en
 * orden de prioridad hasta cubrir la diferencia económica de la transformación.
 * Cada fuente puede cubrir parcial o totalmente el monto restante.
 *
 * Orden por defecto del pipeline:
 *   1. Promociones aplicables
 *   2. Cupones
 *   3. Puntos disponibles
 *   4. Créditos
 *   5. Campañas activas
 *   6. Beneficios VIP
 *   7. Beneficios por cumpleaños
 *   8. Autorizaciones especiales
 *   9. Descuentos automáticos
 *  10. Pago de diferencia (última opción)
 */

import type { ResolutionItem, ResolutionResult, ResolutionSourceType } from './types'

export const DEFAULT_RESOLUTION_ORDER: readonly ResolutionSourceType[] = [
  'PROMOTION',
  'COUPON',
  'POINTS',
  'CREDITS',
  'CAMPAIGN',
  'VIP_BENEFIT',
  'BIRTHDAY_BENEFIT',
  'ADMIN_AUTHORIZATION',
  'AUTOMATIC_DISCOUNT',
  'PAYMENT',
] as const

export interface ResolutionContext {
  readonly companyId: string
  readonly subscriberId: string
  readonly transformationType: string
  readonly sourceBenefitId: string
  readonly targetBenefitId: string
  readonly differenceAmount: number
}

export interface ResolutionSourceResult {
  readonly items: readonly ResolutionItem[]
  readonly totalCovered: number
}

export type ResolutionSourceProvider = (
  ctx: ResolutionContext,
  remainingAmount: number,
) => Promise<ResolutionSourceResult>

export function buildResolution(
  differenceAmount: number,
  contributions: readonly ResolutionItem[],
): ResolutionResult {
  const totalCovered = contributions.reduce((sum, c) => sum + c.amount, 0)
  const remaining = Math.max(0, differenceAmount - totalCovered)

  return {
    items: contributions,
    totalCovered: Math.round(totalCovered * 100) / 100,
    remainingAmount: Math.round(remaining * 100) / 100,
    fullyResolved: remaining <= 0,
  }
}

export async function runResolutionPipeline(
  ctx: ResolutionContext,
  providers: ReadonlyMap<ResolutionSourceType, ResolutionSourceProvider>,
  order: readonly ResolutionSourceType[] = DEFAULT_RESOLUTION_ORDER,
): Promise<ResolutionResult> {
  const allItems: ResolutionItem[] = []
  let remaining = ctx.differenceAmount

  if (remaining <= 0) {
    return buildResolution(ctx.differenceAmount, [])
  }

  for (const sourceType of order) {
    if (remaining <= 0) break

    const provider = providers.get(sourceType)
    if (!provider) continue

    try {
      const result = await provider(ctx, remaining)
      if (result.items.length > 0) {
        allItems.push(...result.items)
        remaining -= result.totalCovered
      }
    } catch {
      // Fire-and-safe: si un proveedor falla, se salta y se pasa al siguiente.
    }
  }

  return buildResolution(ctx.differenceAmount, allItems)
}
