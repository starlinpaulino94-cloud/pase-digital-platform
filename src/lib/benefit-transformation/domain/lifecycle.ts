/**
 * Máquina de estados del Benefit Transformation Engine.
 *
 * REQUESTED → RESOLVING → RESOLVED → PENDING_APPROVAL → APPROVED → PENDING_PAYMENT → EXECUTING → COMPLETED
 *                                   ↘ APPROVED (sin aprobación)  ↗
 *                                   ↘ EXECUTING (sin pago)       ↗
 * Cualquier estado no-terminal → CANCELLED
 * EXECUTING → FAILED
 * PENDING_APPROVAL → REJECTED
 */

import type { TransformationStatus } from './types'
import { TERMINAL_STATUSES } from './types'

const TRANSITIONS: Record<TransformationStatus, readonly TransformationStatus[]> = {
  REQUESTED:        ['RESOLVING', 'CANCELLED'],
  RESOLVING:        ['RESOLVED', 'FAILED', 'CANCELLED'],
  RESOLVED:         ['PENDING_APPROVAL', 'APPROVED', 'EXECUTING', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED:         ['PENDING_PAYMENT', 'EXECUTING', 'CANCELLED'],
  PENDING_PAYMENT:  ['EXECUTING', 'CANCELLED'],
  EXECUTING:        ['COMPLETED', 'FAILED'],
  COMPLETED:        [],
  REJECTED:         [],
  CANCELLED:        [],
  FAILED:           ['REQUESTED'],
}

export { TRANSITIONS as TRANSFORMATION_TRANSITIONS }

export function validateTransition(
  from: TransformationStatus,
  to: TransformationStatus,
): string | null {
  const allowed = TRANSITIONS[from]
  if (!allowed || !allowed.includes(to)) {
    return `Transición inválida: ${from} → ${to}`
  }
  return null
}

export function isTerminal(status: TransformationStatus): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status)
}

export function canCancel(status: TransformationStatus): boolean {
  return !isTerminal(status) && TRANSITIONS[status]?.includes('CANCELLED') === true
}
