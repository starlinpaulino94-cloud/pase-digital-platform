/**
 * Mappers Prisma ↔ dominio del Benefit Transformation Engine (Fase E1.7).
 */

import type {
  BenefitTransformation as PrismaTransformation,
  TransformationPolicy as PrismaPolicy,
} from '@prisma/client'
import type {
  TransformationRecord,
  TransformationPolicy,
  TransformationPolicyConfig,
  ResolutionResult,
  TransformationType,
  TransformationStatus,
} from '../domain/types'

const num = (v: unknown): number | null => {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function mapTransformation(row: PrismaTransformation): TransformationRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    subscriberId: row.subscriberId,
    subscriberKind: row.subscriberKind,
    type: row.type as TransformationType,
    status: row.status as TransformationStatus,
    sourceBenefitId: row.sourceBenefitId,
    sourceGrantId: row.sourceGrantId,
    targetBenefitId: row.targetBenefitId,
    targetGrantId: row.targetGrantId,
    sourceValue: num(row.sourceValue),
    targetValue: num(row.targetValue),
    differenceAmount: num(row.differenceAmount),
    resolvedAmount: num(row.resolvedAmount),
    resolution: (row.resolution as ResolutionResult | null) ?? null,
    policyId: row.policyId,
    requiresApproval: row.requiresApproval,
    approvedById: row.approvedById,
    approvedAt: row.approvedAt,
    rejectionReason: row.rejectionReason,
    sucursalId: row.sucursalId,
    requestedById: row.requestedById,
    config: (row.config ?? {}) as Record<string, unknown>,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
  }
}

export function mapPolicy(row: PrismaPolicy): TransformationPolicy {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.nombre,
    description: row.descripcion,
    type: row.tipo as TransformationType,
    active: row.activa,
    priority: row.prioridad,
    config: (row.config ?? {}) as TransformationPolicyConfig,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
