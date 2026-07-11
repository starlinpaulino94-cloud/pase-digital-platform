/**
 * Máquina de estados de una transacción (Fase E4). Las transiciones son DATOS;
 * `validateTransition` rechaza cualquier movimiento no declarado y toda
 * transición aplicada queda registrada en `transaction_transitions`.
 */

import type { TransactionEstado } from './types'

export const TRANSACTION_TRANSITIONS: Readonly<
  Record<TransactionEstado, readonly TransactionEstado[]>
> = {
  PENDING: ['VALIDATING', 'CANCELLED', 'EXPIRED', 'ERROR'],
  VALIDATING: ['APPROVED', 'CANCELLED', 'EXPIRED', 'ERROR'],
  APPROVED: ['APPLIED', 'CANCELLED', 'ERROR'],
  APPLIED: ['REVERTED'],
  CANCELLED: [],
  REVERTED: [],
  EXPIRED: [],
  ERROR: [],
}

export function canTransition(from: TransactionEstado, to: TransactionEstado): boolean {
  return TRANSACTION_TRANSITIONS[from]?.includes(to) ?? false
}

/** Devuelve un mensaje de error si la transición es inválida; null si es válida. */
export function validateTransition(
  from: TransactionEstado,
  to: TransactionEstado
): string | null {
  if (canTransition(from, to)) return null
  return `Transición inválida: ${from} → ${to}.`
}

export function isTerminal(estado: TransactionEstado): boolean {
  return TRANSACTION_TRANSITIONS[estado].length === 0
}

/** Camino feliz completo de una operación aplicada en un solo paso atómico. */
export const HAPPY_PATH: readonly TransactionEstado[] = [
  'PENDING',
  'VALIDATING',
  'APPROVED',
  'APPLIED',
]
