/**
 * Auditoría de promociones (Fase 4).
 *
 * Define las acciones auditables y la utilidad para calcular el diff de cambios.
 * Registra quién, qué, cuándo, estado anterior/nuevo. Tipos puros; la
 * persistencia la hace el repositorio.
 */

import type { PromotionStatus } from './types'

/** Acciones auditables sobre una promoción. */
export type PromotionAuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'VERSIONED'
  | 'DUPLICATED'
  | 'ARCHIVED'
  | 'RULES_CHANGED'
  | 'ACTIONS_CHANGED'
  | 'RESTRICTIONS_CHANGED'

/** Entrada de auditoría lista para persistir. */
export interface PromotionAuditEntry {
  readonly promotionId: string
  readonly companyId: string
  readonly userId: string | null
  readonly action: PromotionAuditAction
  readonly previousStatus: PromotionStatus | null
  readonly newStatus: PromotionStatus | null
  readonly changes: Readonly<Record<string, { from: unknown; to: unknown }>>
}

/**
 * Calcula el diff campo-a-campo entre dos objetos planos. Solo incluye las
 * claves cuyo valor cambió (comparación por JSON para objetos anidados).
 */
export function computeChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const key of keys) {
    const a = before[key]
    const b = after[key]
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes[key] = { from: a, to: b }
    }
  }
  return changes
}
