/**
 * CATÁLOGO ÚNICO DE MÉTRICAS de la plataforma (Fase E2 — consolidación).
 *
 * La revisión E2 encontró 4 catálogos de métricas independientes (Automation,
 * Benefit, Membership, Referral) con CLAVES REPETIDAS definidas varias veces:
 * `roi` (3×), `beneficios_entregados`/`beneficios_utilizados`,
 * `conversion`/`conversiones`, `retencion` e `ingresos_generados` (2× cada
 * una). Que varios motores compartan una clave es correcto (vocabulario
 * común); que cada uno la DEFINA por su cuenta no lo es.
 *
 * Este módulo fusiona los catálogos en uno solo, deduplicado por `id`, con la
 * procedencia (`engines`) de cada métrica. Los catálogos por motor siguen
 * existiendo (compatibilidad); la regla arquitectónica es: una métrica nueva
 * se registra con una clave ya existente aquí si nombra el mismo indicador.
 *
 * Solo agrega y describe: cero cambio de comportamiento.
 */

import { AUTOMATION_METRIC_CATALOG } from '@/lib/automation'
import { BENEFIT_METRIC_CATALOG } from '@/lib/benefits'
import { MEMBERSHIP_METRIC_CATALOG } from '@/lib/membership'
import { REFERRAL_METRIC_CATALOG } from '@/lib/referral'

/** Motor propietario de una métrica dentro del catálogo unificado. */
export type MetricEngine = 'automation' | 'benefit' | 'membership' | 'referral'

export interface PlatformMetricDef {
  readonly id: string
  readonly name: string
  readonly description: string
  /** Motores que reportan esta métrica (>=2 ⇒ métrica compartida). */
  readonly engines: readonly MetricEngine[]
}

const SOURCES: readonly [MetricEngine, readonly { id: string; name: string; description: string }[]][] = [
  ['automation', AUTOMATION_METRIC_CATALOG],
  ['benefit', BENEFIT_METRIC_CATALOG],
  ['membership', MEMBERSHIP_METRIC_CATALOG],
  ['referral', REFERRAL_METRIC_CATALOG],
]

function merge(): PlatformMetricDef[] {
  const byId = new Map<string, { name: string; description: string; engines: MetricEngine[] }>()
  for (const [engine, catalog] of SOURCES) {
    for (const m of catalog) {
      const prev = byId.get(m.id)
      if (prev) {
        prev.engines.push(engine)
      } else {
        byId.set(m.id, { name: m.name, description: m.description, engines: [engine] })
      }
    }
  }
  return [...byId.entries()].map(([id, v]) => ({
    id,
    name: v.name,
    description: v.description,
    engines: v.engines,
  }))
}

/** Catálogo único de métricas (deduplicado por id, con procedencia). */
export const PLATFORM_METRIC_CATALOG: readonly PlatformMetricDef[] = merge()

/** Métricas compartidas por 2+ motores (el vocabulario común de la plataforma). */
export const SHARED_METRICS: readonly PlatformMetricDef[] = PLATFORM_METRIC_CATALOG.filter(
  (m) => m.engines.length >= 2,
)

/** Busca una métrica del catálogo unificado por su clave. */
export function platformMetric(id: string): PlatformMetricDef | undefined {
  return PLATFORM_METRIC_CATALOG.find((m) => m.id === id)
}
