/**
 * Puertos del Benefit Transformation Engine (Fase E1.7).
 * El servicio depende de estas abstracciones, no de Prisma.
 */

import type {
  TransformationRecord,
  TransformationStatus,
  TransformationType,
  TransformationPolicy,
  TransformationPolicyConfig,
  ResolutionResult,
} from '../domain/types'

// ── Create / Update DTOs ───────────────────────────────────────────────────

export interface CreateTransformationData {
  readonly companyId: string
  readonly subscriberId: string
  readonly subscriberKind?: string
  readonly type: TransformationType
  readonly sourceBenefitId: string
  readonly sourceGrantId?: string | null
  readonly targetBenefitId?: string | null
  readonly targetGrantId?: string | null
  readonly sourceValue?: number | null
  readonly targetValue?: number | null
  readonly differenceAmount?: number | null
  readonly resolvedAmount?: number | null
  readonly resolution?: ResolutionResult | null
  readonly policyId?: string | null
  readonly requiresApproval?: boolean
  readonly sucursalId?: string | null
  readonly requestedById?: string | null
  readonly config?: Record<string, unknown>
  readonly metadata?: Record<string, unknown>
}

export interface UpdateTransformationData {
  readonly status?: TransformationStatus
  readonly targetBenefitId?: string | null
  readonly targetGrantId?: string | null
  readonly sourceValue?: number | null
  readonly targetValue?: number | null
  readonly differenceAmount?: number | null
  readonly resolvedAmount?: number | null
  readonly resolution?: ResolutionResult | null
  readonly policyId?: string | null
  readonly requiresApproval?: boolean
  readonly approvedById?: string | null
  readonly approvedAt?: Date | null
  readonly rejectionReason?: string | null
  readonly config?: Record<string, unknown>
  readonly metadata?: Record<string, unknown>
  readonly completedAt?: Date | null
}

// ── Policy DTOs ────────────────────────────────────────────────────────────

export interface CreatePolicyData {
  readonly companyId: string
  readonly name: string
  readonly description?: string | null
  readonly type: TransformationType
  readonly active?: boolean
  readonly priority?: number
  readonly config?: TransformationPolicyConfig
  readonly metadata?: Record<string, unknown>
}

export interface UpdatePolicyData {
  readonly name?: string
  readonly description?: string | null
  readonly active?: boolean
  readonly priority?: number
  readonly config?: TransformationPolicyConfig
  readonly metadata?: Record<string, unknown>
}

// ── Repository ─────────────────────────────────────────────────────────────

export interface TransformationRepository {
  create(data: CreateTransformationData): Promise<TransformationRecord>
  update(id: string, data: UpdateTransformationData): Promise<TransformationRecord>
  findById(id: string): Promise<TransformationRecord | null>
  list(query: {
    companyId: string
    subscriberId?: string
    type?: TransformationType
    status?: TransformationStatus
  }): Promise<TransformationRecord[]>

  countBySubscriber(query: {
    companyId: string
    subscriberId: string
    type?: TransformationType
    since?: Date
  }): Promise<number>

  createPolicy(data: CreatePolicyData): Promise<TransformationPolicy>
  updatePolicy(id: string, data: UpdatePolicyData): Promise<TransformationPolicy>
  findPolicyById(id: string): Promise<TransformationPolicy | null>
  listPolicies(companyId: string, type?: TransformationType): Promise<TransformationPolicy[]>
}
