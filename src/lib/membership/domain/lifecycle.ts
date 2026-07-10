/**
 * Ciclo de vida de una membresía de suscriptor (Fase A).
 *
 * Transiciones controladas entre estados. Reutiliza el patrón del Promotion
 * Framework. No permite movimientos inválidos.
 */

import type { MembershipInstanceStatus } from './types'

export const MEMBERSHIP_TRANSITIONS: Readonly<
  Record<MembershipInstanceStatus, readonly MembershipInstanceStatus[]>
> = {
  PENDING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'SUSPENDED', 'EXPIRED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
  EXPIRED: ['ACTIVE'], // renovación reactiva
  CANCELLED: [],
}

export function canTransition(
  from: MembershipInstanceStatus,
  to: MembershipInstanceStatus,
): boolean {
  return MEMBERSHIP_TRANSITIONS[from].includes(to)
}

export function validateTransition(
  from: MembershipInstanceStatus,
  to: MembershipInstanceStatus,
): string | null {
  if (from === to) return `La membresía ya está en estado ${to}.`
  if (!canTransition(from, to)) {
    const allowed = MEMBERSHIP_TRANSITIONS[from].join(', ') || '(ninguna, estado terminal)'
    return `Transición inválida: ${from} → ${to}. Permitidas: ${allowed}.`
  }
  return null
}
