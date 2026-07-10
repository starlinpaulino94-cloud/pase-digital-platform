/**
 * Adaptador Prisma del Benefit Transformation Engine (Fase E1.7).
 */

import type { PrismaClient } from '@prisma/client'
import type {
  TransformationRepository,
  CreateTransformationData,
  UpdateTransformationData,
  CreatePolicyData,
  UpdatePolicyData,
} from '../application/ports'
import type {
  TransformationRecord,
  TransformationPolicy,
  TransformationType,
  TransformationStatus,
} from '../domain/types'
import { mapTransformation, mapPolicy } from './mappers'

export class PrismaTransformationRepository implements TransformationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateTransformationData): Promise<TransformationRecord> {
    const row = await this.prisma.benefitTransformation.create({
      data: {
        companyId: data.companyId,
        subscriberId: data.subscriberId,
        subscriberKind: data.subscriberKind ?? 'CLIENT',
        type: data.type,
        status: 'REQUESTED',
        sourceBenefitId: data.sourceBenefitId,
        sourceGrantId: data.sourceGrantId ?? null,
        targetBenefitId: data.targetBenefitId ?? null,
        targetGrantId: data.targetGrantId ?? null,
        sourceValue: data.sourceValue ?? null,
        targetValue: data.targetValue ?? null,
        differenceAmount: data.differenceAmount ?? null,
        resolvedAmount: data.resolvedAmount ?? null,
        resolution: (data.resolution as object) ?? {},
        policyId: data.policyId ?? null,
        requiresApproval: data.requiresApproval ?? false,
        sucursalId: data.sucursalId ?? null,
        requestedById: data.requestedById ?? null,
        config: (data.config as object) ?? {},
        metadata: (data.metadata as object) ?? {},
      },
    })
    return mapTransformation(row)
  }

  async update(id: string, data: UpdateTransformationData): Promise<TransformationRecord> {
    const update: Record<string, unknown> = {}

    if (data.status !== undefined) update.status = data.status
    if (data.targetBenefitId !== undefined) update.targetBenefitId = data.targetBenefitId
    if (data.targetGrantId !== undefined) update.targetGrantId = data.targetGrantId
    if (data.sourceValue !== undefined) update.sourceValue = data.sourceValue
    if (data.targetValue !== undefined) update.targetValue = data.targetValue
    if (data.differenceAmount !== undefined) update.differenceAmount = data.differenceAmount
    if (data.resolvedAmount !== undefined) update.resolvedAmount = data.resolvedAmount
    if (data.resolution !== undefined) update.resolution = (data.resolution as object) ?? {}
    if (data.policyId !== undefined) update.policyId = data.policyId
    if (data.requiresApproval !== undefined) update.requiresApproval = data.requiresApproval
    if (data.approvedById !== undefined) update.approvedById = data.approvedById
    if (data.approvedAt !== undefined) update.approvedAt = data.approvedAt
    if (data.rejectionReason !== undefined) update.rejectionReason = data.rejectionReason
    if (data.config !== undefined) update.config = data.config as object
    if (data.metadata !== undefined) update.metadata = data.metadata as object
    if (data.completedAt !== undefined) update.completedAt = data.completedAt

    // sourceValue is set via resolve(), not update — included in create only
    const row = await this.prisma.benefitTransformation.update({
      where: { id },
      data: update,
    })
    return mapTransformation(row)
  }

  async findById(id: string): Promise<TransformationRecord | null> {
    const row = await this.prisma.benefitTransformation.findUnique({ where: { id } })
    return row ? mapTransformation(row) : null
  }

  async list(query: {
    companyId: string
    subscriberId?: string
    type?: TransformationType
    status?: TransformationStatus
  }): Promise<TransformationRecord[]> {
    const where: Record<string, unknown> = { companyId: query.companyId }
    if (query.subscriberId) where.subscriberId = query.subscriberId
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status

    const rows = await this.prisma.benefitTransformation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(mapTransformation)
  }

  async countBySubscriber(query: {
    companyId: string
    subscriberId: string
    type?: TransformationType
    since?: Date
  }): Promise<number> {
    const where: Record<string, unknown> = {
      companyId: query.companyId,
      subscriberId: query.subscriberId,
    }
    if (query.type) where.type = query.type
    if (query.since) where.createdAt = { gte: query.since }

    return this.prisma.benefitTransformation.count({ where })
  }

  // ── Policies ───────────────────────────────────────────────────────────

  async createPolicy(data: CreatePolicyData): Promise<TransformationPolicy> {
    const row = await this.prisma.transformationPolicy.create({
      data: {
        companyId: data.companyId,
        nombre: data.name,
        descripcion: data.description ?? null,
        tipo: data.type,
        activa: data.active ?? true,
        prioridad: data.priority ?? 0,
        config: (data.config as object) ?? {},
        metadata: (data.metadata as object) ?? {},
      },
    })
    return mapPolicy(row)
  }

  async updatePolicy(id: string, data: UpdatePolicyData): Promise<TransformationPolicy> {
    const update: Record<string, unknown> = {}
    if (data.name !== undefined) update.nombre = data.name
    if (data.description !== undefined) update.descripcion = data.description
    if (data.active !== undefined) update.activa = data.active
    if (data.priority !== undefined) update.prioridad = data.priority
    if (data.config !== undefined) update.config = data.config as object
    if (data.metadata !== undefined) update.metadata = data.metadata as object

    const row = await this.prisma.transformationPolicy.update({
      where: { id },
      data: update,
    })
    return mapPolicy(row)
  }

  async findPolicyById(id: string): Promise<TransformationPolicy | null> {
    const row = await this.prisma.transformationPolicy.findUnique({ where: { id } })
    return row ? mapPolicy(row) : null
  }

  async listPolicies(companyId: string, type?: TransformationType): Promise<TransformationPolicy[]> {
    const where: Record<string, unknown> = { companyId }
    if (type) where.tipo = type

    const rows = await this.prisma.transformationPolicy.findMany({
      where,
      orderBy: { prioridad: 'desc' },
    })
    return rows.map(mapPolicy)
  }
}
