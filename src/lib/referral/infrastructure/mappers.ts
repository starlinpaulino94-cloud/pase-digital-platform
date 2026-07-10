/**
 * Mappers Prisma ↔ dominio del Referral Engine (Fase D).
 */

import type {
  ReferralProgram as PrismaProgram,
  ReferralParticipant as PrismaParticipant,
  ReferralReferral as PrismaReferral,
} from '@prisma/client'
import type {
  ReferralConfig,
  ReferralHistoryEntry,
  ReferralParticipant,
  ReferralProgram,
  ReferralProgramStatus,
  ReferralReferral,
} from '../domain/types'

const STATUSES: readonly ReferralProgramStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

function toStatus(raw: string): ReferralProgramStatus {
  return (STATUSES as readonly string[]).includes(raw) ? (raw as ReferralProgramStatus) : 'DRAFT'
}

export function mapProgram(row: PrismaProgram): ReferralProgram {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.nombre,
    objective: row.objetivo,
    type: row.type,
    templateKey: row.templateKey,
    config: (row.config ?? {}) as ReferralConfig,
    status: toStatus(row.status),
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function mapParticipant(row: PrismaParticipant): ReferralParticipant {
  return {
    id: row.id,
    companyId: row.companyId,
    programId: row.programId,
    referrerId: row.referrerId,
    referrerKind: row.referrerKind,
    code: row.code,
    status: row.status,
    level: row.level,
    referralsCount: row.referralsCount,
    convertedCount: row.convertedCount,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function mapReferral(row: PrismaReferral): ReferralReferral {
  return {
    id: row.id,
    companyId: row.companyId,
    programId: row.programId,
    participantId: row.participantId,
    referredId: row.referredId,
    referredKind: row.referredKind,
    state: row.state,
    history: (row.history ?? []) as unknown as ReferralHistoryEntry[],
    suspicious: row.suspicious,
    fraudReasons: (row.fraudReasons ?? []) as unknown as string[],
    rewardReleased: row.rewardReleased,
    rewardGrantId: row.rewardGrantId,
    invitedAt: row.invitedAt,
    meta: (row.meta ?? {}) as Record<string, unknown>,
  }
}
