/**
 * Registro de Automation Playbooks (Fase E1.1+). Punto único para consultar la
 * biblioteca por categoría e industria. E1.1 aporta la categoría "captación";
 * las próximas fases (E1.2–E1.10) registran aquí sus categorías sin duplicar
 * lógica.
 */

import { ACQUISITION_PLAYBOOKS } from './acquisition'
import { ONBOARDING_PLAYBOOKS } from './onboarding'
import { isCompatibleWith, type AutomationPlaybook, type IndustryKey, type PlaybookCategory } from './types'

/** Todos los playbooks registrados de todas las categorías. */
export const ALL_PLAYBOOKS: readonly AutomationPlaybook[] = [
  ...ACQUISITION_PLAYBOOKS,
  ...ONBOARDING_PLAYBOOKS,
]

const BY_ID = new Map(ALL_PLAYBOOKS.map((p) => [p.id, p]))

/** Busca un playbook por su Automation ID (ej. "ACQ-001"). */
export function getPlaybook(id: string): AutomationPlaybook | undefined {
  return BY_ID.get(id)
}

/** Playbooks de una categoría (ej. "captacion"). */
export function playbooksByCategory(category: PlaybookCategory): readonly AutomationPlaybook[] {
  return ALL_PLAYBOOKS.filter((p) => p.category === category)
}

/** Playbooks compatibles con una industria (incluye los universales). */
export function playbooksForIndustry(industry: IndustryKey): readonly AutomationPlaybook[] {
  return ALL_PLAYBOOKS.filter((p) => isCompatibleWith(p, industry))
}
