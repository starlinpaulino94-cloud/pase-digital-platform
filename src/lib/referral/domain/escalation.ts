/**
 * Escalado progresivo (Fase D, Modelo 5). Dado el número de referidos
 * convertidos de un participante, determina el nivel alcanzado y qué peldaños
 * se acaban de desbloquear. Puro y determinista.
 *
 * Ejemplo del documento: 1→aroma, 3→lavado básico, 5→premium, 10→Silver,
 * 20→Gold, 50→Platinum, 100→embajador.
 */

import type { ReferralTier } from './types'

/** Peldaños ordenados por umbral ascendente. */
function sortedTiers(tiers: readonly ReferralTier[]): readonly ReferralTier[] {
  return [...tiers].sort((a, b) => a.threshold - b.threshold)
}

/** Nivel (índice 1-based) alcanzado con `convertedCount` referidos. */
export function levelFor(tiers: readonly ReferralTier[], convertedCount: number): number {
  const sorted = sortedTiers(tiers)
  let level = 0
  for (const tier of sorted) {
    if (convertedCount >= tier.threshold) level++
    else break
  }
  return level
}

/** El peldaño vigente (el de mayor umbral alcanzado), o null. */
export function currentTier(
  tiers: readonly ReferralTier[],
  convertedCount: number,
): ReferralTier | null {
  const sorted = sortedTiers(tiers)
  let current: ReferralTier | null = null
  for (const tier of sorted) {
    if (convertedCount >= tier.threshold) current = tier
    else break
  }
  return current
}

/** El siguiente peldaño por alcanzar (para mostrar "faltan X"), o null. */
export function nextTier(
  tiers: readonly ReferralTier[],
  convertedCount: number,
): ReferralTier | null {
  return sortedTiers(tiers).find((t) => convertedCount < t.threshold) ?? null
}

export interface EscalationResult {
  /** Nivel nuevo tras el incremento. */
  readonly level: number
  /** ¿Subió de nivel respecto a `previousLevel`? */
  readonly leveledUp: boolean
  /** Peldaños desbloqueados en esta transición (para entregar sus recompensas). */
  readonly unlocked: readonly ReferralTier[]
}

/**
 * Compara el nivel previo con el nuevo y devuelve los peldaños desbloqueados
 * entre ambos (uno o varios si el conteo saltó varios umbrales).
 */
export function applyEscalation(
  tiers: readonly ReferralTier[],
  previousConverted: number,
  newConverted: number,
): EscalationResult {
  const sorted = sortedTiers(tiers)
  const prevLevel = levelFor(sorted, previousConverted)
  const newLevel = levelFor(sorted, newConverted)
  const unlocked = sorted.slice(prevLevel, newLevel)
  return { level: newLevel, leveledUp: newLevel > prevLevel, unlocked }
}
