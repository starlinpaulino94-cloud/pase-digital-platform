/**
 * Utilidades puras de scoring y banda para la arquitectura de decisiones
 * (Fase E1.10). Sin efectos secundarios; reutilizables por cualquier proveedor.
 */

import type { DecisionBand, DecisionThresholds } from './types'

/** Recorta un número al rango [0, 1]. */
export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return n < 0 ? 0 : n > 1 ? 1 : n
}

/** Lee un hecho numérico del contexto (con valor por defecto). */
export function num(facts: Readonly<Record<string, unknown>>, key: string, def = 0): number {
  const v = facts[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : def
}

/** Lee un hecho booleano del contexto. */
export function bool(facts: Readonly<Record<string, unknown>>, key: string, def = false): boolean {
  const v = facts[key]
  return typeof v === 'boolean' ? v : def
}

/** Lee un hecho de texto del contexto. */
export function str(facts: Readonly<Record<string, unknown>>, key: string, def = ''): string {
  const v = facts[key]
  return typeof v === 'string' ? v : def
}

/**
 * Convierte un score [0..1] en banda cualitativa usando umbrales configurables.
 * Por defecto: <0.34 low, <0.67 medium, resto high.
 */
export function band(score: number, thresholds?: DecisionThresholds): DecisionBand {
  const low = thresholds?.low ?? 0.34
  const high = thresholds?.high ?? 0.67
  if (score < low) return 'low'
  if (score < high) return 'medium'
  return 'high'
}

/** Ordena candidatos por score descendente (estable, sin mutar). */
export function byScoreDesc<T extends { readonly score?: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}
