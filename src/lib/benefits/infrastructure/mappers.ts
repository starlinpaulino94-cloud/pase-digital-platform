/**
 * Mappers Prisma ↔ dominio del Benefit Engine (Fase C).
 */

import type {
  Benefit as PrismaBenefit,
  BenefitGrant as PrismaGrant,
} from '@prisma/client'
import type {
  Benefit,
  BenefitConfig,
  BenefitGrant,
  BenefitStatus,
} from '../domain/types'

const STATUSES: readonly BenefitStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

function toStatus(raw: string): BenefitStatus {
  return (STATUSES as readonly string[]).includes(raw) ? (raw as BenefitStatus) : 'DRAFT'
}

const toNum = (v: unknown): number | null =>
  v == null ? null : Number(v as number)

export function mapBenefit(row: PrismaBenefit): Benefit {
  return {
    id: row.id,
    companyId: row.companyId,
    code: row.code,
    name: row.nombre,
    description: row.descripcion,
    category: row.categoria,
    type: row.tipo,
    perceivedValue: toNum(row.valorPercibido),
    realCost: toNum(row.costoReal),
    templateKey: row.templateKey,
    config: (row.config ?? {}) as BenefitConfig,
    status: toStatus(row.status),
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function mapGrant(row: PrismaGrant): BenefitGrant {
  return {
    id: row.id,
    companyId: row.companyId,
    benefitId: row.benefitId,
    subscriberId: row.subscriberId,
    subscriberKind: row.subscriberKind,
    sourceModule: row.sourceModule,
    status: row.status,
    grantedAt: row.grantedAt,
    redeemedAt: row.redeemedAt,
    expiresAt: row.expiresAt,
    meta: (row.meta ?? {}) as Record<string, unknown>,
  }
}
