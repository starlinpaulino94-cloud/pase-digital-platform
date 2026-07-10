/**
 * EventDispatcher: bus de eventos del Automation Engine (Fase E1). Toda acción
 * importante genera un evento; este despachador encuentra las automatizaciones
 * PUBLISHED disparadas por ese evento y las ejecuta (encadenado). Incluye una
 * guardia de profundidad para evitar cadenas infinitas.
 */

import type { AutomationEngine, RunOutcome } from './automation-engine'
import type { AutomationRepository } from './ports'

export interface DispatchEventInput {
  readonly companyId: string
  readonly type: string
  readonly subjectId?: string | null
  readonly subjectKind?: string
  readonly payload?: Record<string, unknown>
  /** Profundidad actual de encadenado (interno). */
  readonly depth?: number
}

export interface EventDispatcherOptions {
  /** Profundidad máxima de encadenado (evita bucles). Por defecto 5. */
  readonly maxDepth?: number
}

export class EventDispatcher {
  private readonly maxDepth: number

  constructor(
    private readonly repo: AutomationRepository,
    private readonly engine: AutomationEngine,
    options: EventDispatcherOptions = {},
  ) {
    this.maxDepth = options.maxDepth ?? 5
  }

  /**
   * Despacha un evento: ejecuta cada automatización suscrita. Devuelve los
   * resultados de las ejecuciones directas (el encadenado posterior lo dispara
   * cada automatización al emitir sus propios eventos).
   */
  async dispatch(input: DispatchEventInput): Promise<RunOutcome[]> {
    const depth = input.depth ?? 0
    if (depth >= this.maxDepth) return []

    const automations = await this.repo.findByEvent(input.companyId, input.type)
    const outcomes: RunOutcome[] = []
    for (const automation of automations) {
      const outcome = await this.engine.run(automation, {
        subjectId: input.subjectId ?? null,
        subjectKind: input.subjectKind,
        triggeredBy: `event:${input.type}`,
        // El payload va en la RAÍZ para que las condiciones/variables de los
        // playbooks (`cliente.*`, `membresia.*`, `evento.*`…) resuelvan igual
        // que en una ejecución directa; `event` conserva el tipo del evento.
        triggerData: { ...input.payload, event: { type: input.type, ...input.payload } },
      })
      outcomes.push(outcome)
    }
    return outcomes
  }
}
