/**
 * PrismaReferralRepository: adaptador del puerto ReferralRepository.
 * Única pieza del Referral Engine que conoce Prisma.
 */

import type { Prisma, PrismaClient } from '@prisma/client'
import type {
  ReferralModel,
  ReferralParticipant,
  ReferralParticipantStatus,
  ReferralProgram,
  ReferralProgramStatus,
  ReferralReferral,
} from '../domain/types'
import type {
  CreateProgramData,
  CreateReferralData,
  EnrollData,
  ReferralRepository,
  UpdateProgramData,
} from '../application/ports'
import { mapParticipant, mapProgram, mapReferral } from './mappers'

function json(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue
}

export class PrismaReferralRepository implements ReferralRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Programas ──
  async createProgram(data: CreateProgramData): Promise<ReferralProgram> {
    const row = await this.db.referralProgram.create({
      data: {
        companyId: data.companyId,
        nombre: data.name,
        objetivo: data.objective ?? null,
        type: data.type,
        templateKey: data.templateKey ?? null,
        config: json(data.config),
        metadata: json(data.metadata),
      },
    })
    return mapProgram(row)
  }

  async updateProgram(id: string, data: UpdateProgramData): Promise<ReferralProgram> {
    const row = await this.db.referralProgram.update({
      where: { id },
      data: {
        nombre: data.name,
        objetivo: data.objective,
        config: data.config === undefined ? undefined : json(data.config),
        status: data.status,
        metadata: data.metadata === undefined ? undefined : json(data.metadata),
      },
    })
    return mapProgram(row)
  }

  async findProgram(id: string): Promise<ReferralProgram | null> {
    const row = await this.db.referralProgram.findUnique({ where: { id } })
    return row ? mapProgram(row) : null
  }

  async listPrograms(
    companyId: string,
    filter?: { status?: ReferralProgramStatus; type?: ReferralModel },
  ): Promise<ReferralProgram[]> {
    const rows = await this.db.referralProgram.findMany({
      where: {
        companyId,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.type ? { type: filter.type } : {}),
      },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(mapProgram)
  }

  // ── Participantes ──
  async createParticipant(data: EnrollData): Promise<ReferralParticipant> {
    const row = await this.db.referralParticipant.create({
      data: {
        companyId: data.companyId,
        programId: data.programId,
        referrerId: data.referrerId,
        referrerKind: data.referrerKind ?? 'CLIENT',
        code: data.code,
      },
    })
    return mapParticipant(row)
  }

  async findParticipant(id: string): Promise<ReferralParticipant | null> {
    const row = await this.db.referralParticipant.findUnique({ where: { id } })
    return row ? mapParticipant(row) : null
  }

  async findParticipantByCode(programId: string, code: string): Promise<ReferralParticipant | null> {
    const row = await this.db.referralParticipant.findUnique({
      where: { programId_code: { programId, code } },
    })
    return row ? mapParticipant(row) : null
  }

  async updateParticipant(
    id: string,
    data: Partial<{
      status: ReferralParticipantStatus
      level: number
      referralsCount: number
      convertedCount: number
    }>,
  ): Promise<ReferralParticipant> {
    const row = await this.db.referralParticipant.update({ where: { id }, data })
    return mapParticipant(row)
  }

  // ── Referidos ──
  async createReferral(data: CreateReferralData): Promise<ReferralReferral> {
    const row = await this.db.referralReferral.create({
      data: {
        companyId: data.companyId,
        programId: data.programId,
        participantId: data.participantId,
        referredId: data.referredId ?? null,
        referredKind: data.referredKind ?? 'CLIENT',
        state: data.state,
        history: json([{ state: data.state, at: new Date().toISOString() }]),
        suspicious: data.suspicious,
        fraudReasons: json(data.fraudReasons),
        meta: json(data.meta),
      },
    })
    return mapReferral(row)
  }

  async findReferral(id: string): Promise<ReferralReferral | null> {
    const row = await this.db.referralReferral.findUnique({ where: { id } })
    return row ? mapReferral(row) : null
  }

  async updateReferral(
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
  ): Promise<ReferralReferral> {
    const row = await this.db.referralReferral.update({
      where: { id },
      data: {
        referredId: data.referredId,
        state: data.state,
        history: data.history === undefined ? undefined : json(data.history),
        suspicious: data.suspicious,
        fraudReasons: data.fraudReasons === undefined ? undefined : json(data.fraudReasons),
        rewardReleased: data.rewardReleased,
        rewardGrantId: data.rewardGrantId,
      },
    })
    return mapReferral(row)
  }

  countReferrals(participantId: string, since?: Date): Promise<number> {
    return this.db.referralReferral.count({
      where: { participantId, ...(since ? { invitedAt: { gte: since } } : {}) },
    })
  }

  countRewardsReleased(programId: string): Promise<number> {
    return this.db.referralReferral.count({
      where: { programId, rewardReleased: true },
    })
  }
}
