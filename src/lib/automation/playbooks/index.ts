/**
 * Registro de Automation Playbooks (Fase E1.1+). Punto único para consultar la
 * biblioteca por categoría e industria. E1.1 aporta la categoría "captación";
 * las próximas fases (E1.2–E1.10) registran aquí sus categorías sin duplicar
 * lógica.
 */

import { ACQUISITION_PLAYBOOKS } from './acquisition'
import { ONBOARDING_PLAYBOOKS } from './onboarding'
import { FIRST_PURCHASE_PLAYBOOKS } from './first-purchase'
import { FREQUENCY_PLAYBOOKS } from './frequency'
import { RECOVERY_PLAYBOOKS } from './recovery'
import { MEMBERSHIP_PLAYBOOKS } from './membership'
import { REFERRAL_PLAYBOOKS } from './referral'
import { CAMPAIGN_PLAYBOOKS } from './campaign'
import { GAMIFICATION_PLAYBOOKS } from './gamification'
import { DECISION_PLAYBOOKS } from './decision'
import { isCompatibleWith, type AutomationPlaybook, type IndustryKey, type PlaybookCategory } from './types'

/** Todos los playbooks registrados de todas las categorías. */
export const ALL_PLAYBOOKS: readonly AutomationPlaybook[] = [
  ...ACQUISITION_PLAYBOOKS,
  ...ONBOARDING_PLAYBOOKS,
  ...FIRST_PURCHASE_PLAYBOOKS,
  ...FREQUENCY_PLAYBOOKS,
  ...RECOVERY_PLAYBOOKS,
  ...MEMBERSHIP_PLAYBOOKS,
  ...REFERRAL_PLAYBOOKS,
  ...CAMPAIGN_PLAYBOOKS,
  ...GAMIFICATION_PLAYBOOKS,
  ...DECISION_PLAYBOOKS,
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
