/**
 * Puente Referral → Benefit Engine (Fase D ↔ Fase C). Las recompensas de un
 * programa de referidos NO se re-implementan: referencian beneficios del
 * Benefit Engine (por `benefitId` o `benefitCode` de una plantilla). Aquí se
 * resuelve qué beneficio y a quién entregar, para que la capa de aplicación lo
 * conceda con `BenefitService.grant`. "No debe duplicar lógica."
 */

import type { ReferralReward, RewardTarget } from './types'

/** Instrucción de entrega resuelta: a quién y qué beneficio conceder. */
export interface RewardGrantPlan {
  /** 'REFERRER' | 'REFERRED'. Un target BOTH produce dos planes. */
  readonly to: Exclude<RewardTarget, 'BOTH'>
  readonly benefitId?: string
  readonly benefitCode?: string
  readonly label?: string
}

/**
 * Expande una recompensa en uno o dos planes de entrega (BOTH → referrer +
 * referred). El id/label del beneficio se conserva para que la aplicación lo
 * resuelva contra el catálogo de beneficios de la empresa.
 */
export function rewardGrantPlans(reward: ReferralReward): readonly RewardGrantPlan[] {
  const base = {
    benefitId: reward.benefitId,
    benefitCode: reward.benefitCode,
    label: reward.label,
  }
  if (reward.target === 'BOTH') {
    return [
      { ...base, to: 'REFERRER' },
      { ...base, to: 'REFERRED' },
    ]
  }
  return [{ ...base, to: reward.target }]
}
