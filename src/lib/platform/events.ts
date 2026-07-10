/**
 * CATÁLOGO ÚNICO DE EVENTOS de la plataforma (Fase E2 — consolidación).
 *
 * La fuente de verdad es y sigue siendo `@/lib/automation/domain/events.ts`
 * (ningún otro motor define eventos). Este módulo la formaliza como catálogo
 * de PLATAFORMA y documenta los alias semánticos detectados en la revisión
 * E2: pares de eventos que nombran el mismo hecho de negocio desde dos
 * perspectivas (se crearon en fases distintas). No se elimina ninguno —
 * los playbooks publicados los referencian — pero queda definido cuál es el
 * CANÓNICO para todo código nuevo.
 *
 * Solo re-exporta y describe: cero cambio de comportamiento.
 */

import { AUTOMATION_EVENTS, AUTOMATION_EVENT_CATALOG } from '@/lib/automation'
import type { AutomationEventDef, AutomationEventType } from '@/lib/automation'

/** Catálogo único de eventos (fuente: Automation Engine). */
export const PLATFORM_EVENTS = AUTOMATION_EVENTS
export const PLATFORM_EVENT_CATALOG: readonly AutomationEventDef[] = AUTOMATION_EVENT_CATALOG
export type PlatformEventType = AutomationEventType

/**
 * Alias semánticos detectados en E2: `alias` nombra el mismo hecho que
 * `canonical`. El alias queda DEPRECADO para código nuevo; se conserva porque
 * los playbooks instalados lo referencian. La unificación en runtime (resolver
 * alias→canónico al despachar) está en el backlog E2 — hacerlo hoy cambiaría
 * el comportamiento de automatizaciones ya publicadas.
 */
export const EVENT_ALIASES: readonly {
  readonly alias: string
  readonly canonical: string
  readonly reason: string
}[] = [
  {
    alias: AUTOMATION_EVENTS.CLIENT_RENEWED, // 'cliente.renovo' (E1)
    canonical: AUTOMATION_EVENTS.MEMBERSHIP_RENEWED, // 'membresia.renovada' (E1.6)
    reason: 'La renovación es un hecho del ciclo de vida de la membresía.',
  },
  {
    alias: AUTOMATION_EVENTS.CLIENT_CANCELLED, // 'cliente.cancelo' (E1)
    canonical: AUTOMATION_EVENTS.MEMBERSHIP_CANCELLED, // 'membresia.cancelada' (E1.6)
    reason: 'La cancelación es un hecho del ciclo de vida de la membresía.',
  },
  {
    alias: AUTOMATION_EVENTS.CLIENT_REFERRED_FRIEND, // 'cliente.recomendo_amigo' (E1)
    canonical: AUTOMATION_EVENTS.REFERRAL_SHARED, // 'referido.invitacion_compartida' (E1.7)
    reason: 'Compartir la invitación es un hecho del journey de referidos.',
  },
  {
    alias: AUTOMATION_EVENTS.CLIENT_CHURN_RISK, // 'cliente.riesgo_abandono' (E1.4)
    canonical: AUTOMATION_EVENTS.RISK_DETECTED, // 'riesgo.detectado' (E1.10)
    reason: 'El riesgo de abandono es un caso del evento genérico de riesgo.',
  },
]

/** Resuelve un tipo de evento a su forma canónica (alias → canónico). */
export function canonicalEvent(type: string): string {
  return EVENT_ALIASES.find((a) => a.alias === type)?.canonical ?? type
}
