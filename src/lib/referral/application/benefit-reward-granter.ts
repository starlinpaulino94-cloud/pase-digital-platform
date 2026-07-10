/**
 * Adaptador RewardGranter sobre el Benefit Engine (Fase C). Materializa el
 * principio "no duplicar lógica": una recompensa de referido se entrega como un
 * BenefitGrant del módulo `referral`. Resuelve el beneficio por id o por código
 * de plantilla (ej. "CAR-001") dentro del catálogo de la empresa.
 */

import { BENEFIT_MODULES, type BenefitService } from '@/lib/benefits'
import type { RewardGranter } from './referral-service'
import type { RewardGrantPlan } from '../domain/rewards'

export class BenefitRewardGranter implements RewardGranter {
  constructor(private readonly benefits: BenefitService) {}

  async grant(input: {
    companyId: string
    programId: string
    referralId: string
    subscriberId: string
    subscriberKind: string
    plan: RewardGrantPlan
  }): Promise<{ grantId: string | null }> {
    const benefitId = await this.resolveBenefitId(input.companyId, input.plan)
    if (!benefitId) return { grantId: null }

    const res = await this.benefits.grant(
      {
        companyId: input.companyId,
        benefitId,
        subscriberId: input.subscriberId,
        subscriberKind: input.subscriberKind,
        sourceModule: BENEFIT_MODULES.REFERRAL,
        meta: {
          programId: input.programId,
          referralId: input.referralId,
          target: input.plan.to,
        },
      },
      // El referido recibe el beneficio por su rol en el programa, sin más
      // restricción de segmento aquí (el programa ya validó elegibilidad).
      {},
    )
    return { grantId: res.ok ? res.grant.id : null }
  }

  /** Resuelve el beneficio por id directo o por código de plantilla. */
  private async resolveBenefitId(
    companyId: string,
    plan: RewardGrantPlan,
  ): Promise<string | null> {
    if (plan.benefitId) return plan.benefitId
    if (!plan.benefitCode) return null
    const catalog = await this.benefits.listBenefits(companyId, { status: 'PUBLISHED' })
    const match = catalog.find((b) => b.code === plan.benefitCode)
    return match?.id ?? null
  }
}
