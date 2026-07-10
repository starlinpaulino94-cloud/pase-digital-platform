/**
 * Puertos del Benefit Engine (Fase C). El servicio depende de estas
 * abstracciones, no de Prisma.
 */

import type {
  Benefit,
  BenefitConfig,
  BenefitGrant,
  BenefitGrantStatus,
  BenefitStatus,
  BenefitType,
} from '../domain/types'

export interface CreateBenefitData {
  readonly companyId: string
  readonly name: string
  readonly description?: string | null
  readonly category: string
  readonly type: BenefitType
  readonly perceivedValue?: number | null
  readonly realCost?: number | null
  readonly code?: string | null
  readonly templateKey?: string | null
  readonly config?: BenefitConfig
  readonly metadata?: Record<string, unknown>
}

export interface UpdateBenefitData {
  readonly name?: string
  readonly description?: string | null
  readonly category?: string
  readonly perceivedValue?: number | null
  readonly realCost?: number | null
  readonly config?: BenefitConfig
  readonly status?: BenefitStatus
  readonly metadata?: Record<string, unknown>
}

export interface GrantBenefitData {
  readonly companyId: string
  readonly benefitId: string
  readonly subscriberId: string
  readonly subscriberKind?: string
  readonly sourceModule: string
  readonly expiresAt?: Date | null
  readonly meta?: Record<string, unknown>
}

export interface BenefitRepository {
  createBenefit(data: CreateBenefitData): Promise<Benefit>
  updateBenefit(id: string, data: UpdateBenefitData): Promise<Benefit>
  findBenefit(id: string): Promise<Benefit | null>
  listBenefits(
    companyId: string,
    filter?: { status?: BenefitStatus; category?: string; type?: BenefitType },
  ): Promise<Benefit[]>

  createGrant(data: {
    companyId: string
    benefitId: string
    subscriberId: string
    subscriberKind: string
    sourceModule: string
    status: BenefitGrantStatus
    grantedAt: Date
    expiresAt: Date | null
    meta: Record<string, unknown>
  }): Promise<BenefitGrant>
  findGrant(id: string): Promise<BenefitGrant | null>
  updateGrantStatus(
    id: string,
    status: BenefitGrantStatus,
    redeemedAt: Date | null,
  ): Promise<BenefitGrant>

  /** Cuántos grants tiene un suscriptor para un beneficio desde `since` con un estado. */
  countGrants(
    benefitId: string,
    subscriberId: string,
    status: BenefitGrantStatus,
    since?: Date,
  ): Promise<number>
  /** Cuántos grants de un beneficio están canjeados (para stock). */
  countRedeemed(benefitId: string): Promise<number>
}
