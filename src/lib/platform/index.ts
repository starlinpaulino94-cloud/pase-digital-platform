/**
 * REGISTRO ÚNICO DE PLATAFORMA (Fase E2 — Architecture Consolidation).
 *
 * Punto único para consultar los catálogos transversales de MembeGo:
 *
 *  - EVENTOS  → fuente: Automation Engine (único motor que define eventos).
 *  - ACCIONES → fuente: Action Engine / Rule Engine (único catálogo).
 *  - MÉTRICAS → fusión deduplicada de los 4 catálogos por motor.
 *
 * Reglas arquitectónicas que este módulo hace cumplir por convención:
 *  1. Un evento nuevo se añade en `automation/domain/events.ts`, nunca en otro
 *     motor. Ver `EVENT_ALIASES` antes de crear uno (puede ya existir).
 *  2. Una acción nueva se añade en el Action Engine, nunca como constante
 *     local. La ejecución real vive en `LiveActionSink`.
 *  3. Una métrica nueva reutiliza la clave del catálogo unificado si nombra el
 *     mismo indicador (ej. `roi`, `conversion`, `retencion`).
 *
 * Este módulo SOLO re-exporta, fusiona y documenta: no ejecuta nada y no
 * cambia el comportamiento de ningún motor.
 */

export {
  PLATFORM_EVENTS,
  PLATFORM_EVENT_CATALOG,
  EVENT_ALIASES,
  canonicalEvent,
} from './events'
export type { PlatformEventType } from './events'

export { ACTION_TYPES, ACTION_CATALOG } from './actions'
export type { ActionTypeKey } from './actions'

export {
  PLATFORM_METRIC_CATALOG,
  SHARED_METRICS,
  platformMetric,
} from './metrics'
export type { PlatformMetricDef, MetricEngine } from './metrics'
