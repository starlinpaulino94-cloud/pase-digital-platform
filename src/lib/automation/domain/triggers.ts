/**
 * Catálogo de triggers del Automation Engine (Fase E1). Cómo se dispara una
 * automatización. Como DATOS para que la UI y las plantillas los lean.
 */

import type { AutomationTriggerType } from './types'

export interface AutomationTriggerDef {
  readonly id: AutomationTriggerType
  readonly name: string
  readonly description: string
  /** ¿Requiere un evento asociado? (EVENT). */
  readonly needsEvent?: boolean
}

export const AUTOMATION_TRIGGERS: readonly AutomationTriggerDef[] = [
  { id: 'EVENT', name: 'Por evento', description: 'Reacciona a un evento del sistema (encadenado).', needsEvent: true },
  { id: 'SCHEDULE', name: 'Por horario', description: 'Se ejecuta según un cron/horario.' },
  { id: 'SEGMENT_ENTER', name: 'Entra a un segmento', description: 'El cliente entra a un segmento (ej. "en riesgo").' },
  { id: 'DATE', name: 'Por fecha del cliente', description: 'Fecha del cliente (cumpleaños, aniversario, renovación).' },
  { id: 'MANUAL', name: 'Manual', description: 'Ejecución manual desde el panel.' },
]

const BY_ID = new Map(AUTOMATION_TRIGGERS.map((t) => [t.id, t]))
export function automationTrigger(id: AutomationTriggerType): AutomationTriggerDef | undefined {
  return BY_ID.get(id)
}
