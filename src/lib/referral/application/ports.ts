/**
 * Puertos del Referral Engine (Fase D). El servicio depende de estas
 * abstracciones, no de Prisma.
 */

import type {
  ReferralConfig,
  ReferralModel,
  ReferralParticipant,
  ReferralParticipantStatus,
  ReferralProgram,
  ReferralProgramStatus,
  ReferralReferral,
} from '../domain/types'

export interface CreateProgramData {
  readonly companyId: string
  readonly name: string
  readonly objective?: string | null
  readonly type: ReferralModel
  readonly templateKey?: string | null
  readonly config?: ReferralConfig
  readonly metadata?: Record<string, unknown>
}

export interface UpdateProgramData {
  readonly name?: string
  readonly objective?: string | null
  readonly config?: ReferralConfig
  readonly status?: ReferralProgramStatus
  readonly metadata?: Record<string, unknown>
}

export interface EnrollData {
  readonly companyId: string
  readonly programId: string
  readonly referrerId: string
  readonly referrerKind?: string
  readonly code: string
}

export interface CreateReferralData {
  readonly companyId: string
  readonly programId: string
  readonly participantId: string
  readonly referredId?: string | null
  readonly referredKind?: string
  readonly state: string
  readonly suspicious: boolean
  readonly fraudReasons: readonly string[]
  readonly meta?: Record<string, unknown>
}

export interface ReferralRepository {
  createProgram(data: CreateProgramData): Promise<ReferralProgram>
  updateProgram(id: string, data: UpdateProgramData): Promise<ReferralProgram>
  findProgram(id: string): Promise<ReferralProgram | null>
  listPrograms(
    companyId: string,
    filter?: { status?: ReferralProgramStatus; type?: ReferralModel },
  ): Promise<ReferralProgram[]>

  createParticipant(data: EnrollData): Promise<ReferralParticipant>
  findParticipant(id: string): Promise<ReferralParticipant | null>
  findParticipantByCode(programId: string, code: string): Promise<ReferralParticipant | null>
  updateParticipant(
    id: string,
    data: Partial<{
      status: ReferralParticipantStatus
      level: number
      referralsCount: number
      convertedCount: number
    }>,
  ): Promise<ReferralParticipant>

  createReferral(data: CreateReferralData): Promise<ReferralReferral>
  findReferral(id: string): Promise<ReferralReferral | null>
  updateReferral(
    id: string,
    data: Partial<{
      referredId: string | null
      state: string
      history: { state: string; at: string }[]
      suspicious: boolean
      fraudReasons: string[]
      rewardReleased: boolean
      rewardGrantId: string | null
    }>,
  ): Promise<ReferralReferral>

  /** Referidos registrados por un participante desde `since` (para límites). */
  countReferrals(participantId: string, since?: Date): Promise<number>
  /** Recompensas liberadas en un programa (para maxRewards). */
  countRewardsReleased(programId: string): Promise<number>
}
