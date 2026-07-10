/**
 * Motor de estados del ciclo de vida de una promoción (Fase 4).
 *
 * Define las transiciones VÁLIDAS entre estados como datos y las funciones puras
 * para consultarlas y validarlas. No permite transiciones inválidas. Extensible:
 * añadir un estado/transición = editar el mapa, sin tocar el servicio.
 */

import type { PromotionStatus } from './types'

/**
 * Transiciones permitidas: de cada estado, a qué estados se puede pasar.
 * Los estados sin salidas (ARCHIVED) son terminales.
 */
export const PROMOTION_TRANSITIONS: Readonly<Record<PromotionStatus, readonly PromotionStatus[]>> = {
  DRAFT: ['PENDING', 'SCHEDULED', 'ACTIVE', 'CANCELLED', 'ARCHIVED'],
  PENDING: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'CANCELLED'],
  SCHEDULED: ['DRAFT', 'ACTIVE', 'PAUSED', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'SUSPENDED', 'ENDED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'SUSPENDED', 'ENDED', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'ENDED', 'CANCELLED'],
  ENDED: ['ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  ARCHIVED: [],
}

/** Estados terminales (sin transiciones salientes). */
export function isTerminal(status: PromotionStatus): boolean {
  return PROMOTION_TRANSITIONS[status].length === 0
}

/** ¿Se puede pasar de `from` a `to`? */
export function canTransition(from: PromotionStatus, to: PromotionStatus): boolean {
  return PROMOTION_TRANSITIONS[from].includes(to)
}

/** Estados alcanzables desde `from`. */
export function allowedTransitions(from: PromotionStatus): readonly PromotionStatus[] {
  return PROMOTION_TRANSITIONS[from]
}

/**
 * Valida una transición. Devuelve un mensaje de error si es inválida, o null si
 * es válida. No lanza: el servicio decide cómo reportarlo.
 */
export function validateTransition(
  from: PromotionStatus,
  to: PromotionStatus,
): string | null {
  if (from === to) return `La promoción ya está en estado ${to}.`
  if (!canTransition(from, to)) {
    return `Transición inválida: ${from} → ${to}. Permitidas: ${allowedTransitions(from).join(', ') || '(ninguna, estado terminal)'}.`
  }
  return null
}
