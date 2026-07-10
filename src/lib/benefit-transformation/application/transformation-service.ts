/**
 * Servicio principal del Benefit Transformation Engine (Fase E1.7).
 *
 * Orquesta todo el ciclo de vida de una transformación: validación de política,
 * resolución de fondeo, aprobación, ejecución y registro inmutable. Cada
 * operación mutante avanza la máquina de estados.
 */

import type {
  TransformationRecord,
  TransformationRequest,
  TransformationResult,
  TransformationPolicy,
  TransformationType,
  TransformationStatus,
} from '../domain/types'
import type {
  TransformationRepository,
  CreatePolicyData,
  UpdatePolicyData,
} from './ports'
import type { ResolutionEngine } from './resolution-engine'
import { validateTransition, canCancel } from '../domain/lifecycle'
import { calculateDifference } from '../domain/economics'
import { evaluatePolicy } from '../domain/policy'
import type { PolicyEvaluationContext } from '../domain/policy'

export interface TransformationServiceDeps {
  readonly repo: TransformationRepository
  readonly resolutionEngine: ResolutionEngine
}

export class TransformationService {
  private readonly repo: TransformationRepository
  private readonly resolution: ResolutionEngine

  constructor(deps: TransformationServiceDeps) {
    this.repo = deps.repo
    this.resolution = deps.resolutionEngine
  }

  // ── Queries ────────────────────────────────────────────────────────────

  async get(id: string): Promise<TransformationRecord | null> {
    return this.repo.findById(id)
  }

  async list(query: {
    companyId: string
    subscriberId?: string
    type?: TransformationType
    status?: TransformationStatus
  }): Promise<TransformationRecord[]> {
    return this.repo.list(query)
  }

  // ── Request a transformation ───────────────────────────────────────────

  async request(req: TransformationRequest): Promise<TransformationResult> {
    const record = await this.repo.create({
      companyId: req.companyId,
      subscriberId: req.subscriberId,
      subscriberKind: req.subscriberKind ?? 'CLIENT',
      type: req.type,
      sourceBenefitId: req.sourceBenefitId,
      sourceGrantId: req.sourceGrantId ?? null,
      targetBenefitId: req.targetBenefitId ?? null,
      sucursalId: req.sucursalId ?? null,
      requestedById: req.requestedById ?? null,
      config: req.config ?? {},
      metadata: req.metadata ?? {},
    })

    return { ok: true, transformation: record }
  }

  // ── Evaluate policy + resolve funding ──────────────────────────────────

  async resolve(
    id: string,
    sourceValue: number,
    targetValue: number,
    policyCtx?: Partial<PolicyEvaluationContext>,
  ): Promise<TransformationResult> {
    const record = await this.repo.findById(id)
    if (!record) return { ok: false, error: 'Transformación no encontrada.' }

    const transErr = validateTransition(record.status, 'RESOLVING')
    if (transErr) return { ok: false, error: transErr }

    await this.repo.update(id, { status: 'RESOLVING' })

    const policies = await this.repo.listPolicies(record.companyId, record.type)
    const policyEval = evaluatePolicy(policies, {
      type: record.type,
      sourceBenefitId: record.sourceBenefitId,
      targetBenefitId: record.targetBenefitId,
      ...policyCtx,
    })

    if (!policyEval.allowed) {
      await this.repo.update(id, { status: 'FAILED' })
      return { ok: false, error: `Política: ${policyEval.denials.join(', ')}`, code: policyEval.denials[0] }
    }

    const diff = calculateDifference(
      { sourceValue, targetValue },
      policyEval.policy?.config,
    )

    let resolution = null
    if (diff.totalDifference > 0 && record.targetBenefitId) {
      resolution = await this.resolution.resolve(
        {
          companyId: record.companyId,
          subscriberId: record.subscriberId,
          transformationType: record.type,
          sourceBenefitId: record.sourceBenefitId,
          targetBenefitId: record.targetBenefitId,
          differenceAmount: diff.totalDifference,
        },
        policyEval.policy?.config,
      )
    }

    const nextStatus: TransformationStatus = policyEval.requiresApproval
      ? 'PENDING_APPROVAL'
      : policyEval.requiresPayment && (resolution?.remainingAmount ?? 0) > 0
        ? 'APPROVED'
        : 'RESOLVED'

    const updated = await this.repo.update(id, {
      status: nextStatus,
      sourceValue,
      targetValue,
      differenceAmount: diff.totalDifference,
      resolvedAmount: resolution?.remainingAmount ?? diff.totalDifference,
      resolution,
      policyId: policyEval.policy?.id ?? null,
      requiresApproval: policyEval.requiresApproval,
    })

    return { ok: true, transformation: updated }
  }

  // ── Approve / Reject ───────────────────────────────────────────────────

  async approve(id: string, userId?: string | null): Promise<TransformationResult> {
    const record = await this.repo.findById(id)
    if (!record) return { ok: false, error: 'Transformación no encontrada.' }

    const transErr = validateTransition(record.status, 'APPROVED')
    if (transErr) return { ok: false, error: transErr }

    const updated = await this.repo.update(id, {
      status: 'APPROVED',
      approvedById: userId ?? null,
      approvedAt: new Date(),
    })

    return { ok: true, transformation: updated }
  }

  async reject(id: string, reason: string, userId?: string | null): Promise<TransformationResult> {
    const record = await this.repo.findById(id)
    if (!record) return { ok: false, error: 'Transformación no encontrada.' }

    const transErr = validateTransition(record.status, 'REJECTED')
    if (transErr) return { ok: false, error: transErr }

    const updated = await this.repo.update(id, {
      status: 'REJECTED',
      rejectionReason: reason,
      approvedById: userId ?? null,
    })

    return { ok: true, transformation: updated }
  }

  // ── Execute ────────────────────────────────────────────────────────────

  async execute(id: string): Promise<TransformationResult> {
    const record = await this.repo.findById(id)
    if (!record) return { ok: false, error: 'Transformación no encontrada.' }

    const transErr = validateTransition(record.status, 'EXECUTING')
    if (transErr) return { ok: false, error: transErr }

    await this.repo.update(id, { status: 'EXECUTING' })

    return { ok: true, transformation: { ...record, status: 'EXECUTING' } }
  }

  async complete(
    id: string,
    targetGrantId?: string | null,
  ): Promise<TransformationResult> {
    const record = await this.repo.findById(id)
    if (!record) return { ok: false, error: 'Transformación no encontrada.' }

    const transErr = validateTransition(record.status, 'COMPLETED')
    if (transErr) return { ok: false, error: transErr }

    const updated = await this.repo.update(id, {
      status: 'COMPLETED',
      targetGrantId: targetGrantId ?? record.targetGrantId,
      completedAt: new Date(),
    })

    return { ok: true, transformation: updated }
  }

  async fail(id: string, reason?: string): Promise<TransformationResult> {
    const record = await this.repo.findById(id)
    if (!record) return { ok: false, error: 'Transformación no encontrada.' }

    const transErr = validateTransition(record.status, 'FAILED')
    if (transErr) return { ok: false, error: transErr }

    const updated = await this.repo.update(id, {
      status: 'FAILED',
      metadata: { ...record.metadata, failureReason: reason ?? 'unknown' },
    })

    return { ok: true, transformation: updated }
  }

  // ── Cancel ─────────────────────────────────────────────────────────────

  async cancel(id: string): Promise<TransformationResult> {
    const record = await this.repo.findById(id)
    if (!record) return { ok: false, error: 'Transformación no encontrada.' }

    if (!canCancel(record.status)) {
      return { ok: false, error: `No se puede cancelar en estado ${record.status}.` }
    }

    const updated = await this.repo.update(id, { status: 'CANCELLED' })
    return { ok: true, transformation: updated }
  }

  // ── Policy CRUD ────────────────────────────────────────────────────────

  async createPolicy(data: CreatePolicyData): Promise<TransformationPolicy> {
    return this.repo.createPolicy(data)
  }

  async updatePolicy(id: string, data: UpdatePolicyData): Promise<TransformationPolicy> {
    return this.repo.updatePolicy(id, data)
  }

  async getPolicy(id: string): Promise<TransformationPolicy | null> {
    return this.repo.findPolicyById(id)
  }

  async listPolicies(companyId: string, type?: TransformationType): Promise<TransformationPolicy[]> {
    return this.repo.listPolicies(companyId, type)
  }
}
