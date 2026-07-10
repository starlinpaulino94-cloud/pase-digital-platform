/**
 * Tipos de dominio del Benefit Transformation Engine (Fase E1.7).
 *
 * Un beneficio no es estático: puede mejorarse, cambiarse, reemplazarse,
 * personalizarse, dividirse o combinarse antes de ser consumido. Toda esa
 * lógica vive aquí como tipos puros, sin Prisma ni framework.
 */

// ── Enums ──────────────────────────────────────────────────────────────────

export type TransformationType =
  | 'UPGRADE'
  | 'DOWNGRADE'
  | 'EXCHANGE'
  | 'REPLACEMENT'
  | 'CUSTOMIZATION'
  | 'SPLIT'
  | 'MERGE'

export const TRANSFORMATION_TYPES: readonly TransformationType[] = [
  'UPGRADE',
  'DOWNGRADE',
  'EXCHANGE',
  'REPLACEMENT',
  'CUSTOMIZATION',
  'SPLIT',
  'MERGE',
] as const

export type TransformationStatus =
  | 'REQUESTED'
  | 'RESOLVING'
  | 'RESOLVED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PENDING_PAYMENT'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED'

export const TRANSFORMATION_STATUSES: readonly TransformationStatus[] = [
  'REQUESTED',
  'RESOLVING',
  'RESOLVED',
  'PENDING_APPROVAL',
  'APPROVED',
  'PENDING_PAYMENT',
  'EXECUTING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'FAILED',
] as const

export const TERMINAL_STATUSES: readonly TransformationStatus[] = [
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'FAILED',
] as const

// ── Resolution Sources ─────────────────────────────────────────────────────

export type ResolutionSourceType =
  | 'PROMOTION'
  | 'COUPON'
  | 'POINTS'
  | 'CREDITS'
  | 'CAMPAIGN'
  | 'VIP_BENEFIT'
  | 'BIRTHDAY_BENEFIT'
  | 'ADMIN_AUTHORIZATION'
  | 'AUTOMATIC_DISCOUNT'
  | 'PAYMENT'

export const RESOLUTION_SOURCE_TYPES: readonly ResolutionSourceType[] = [
  'PROMOTION',
  'COUPON',
  'POINTS',
  'CREDITS',
  'CAMPAIGN',
  'VIP_BENEFIT',
  'BIRTHDAY_BENEFIT',
  'ADMIN_AUTHORIZATION',
  'AUTOMATIC_DISCOUNT',
  'PAYMENT',
] as const

export interface ResolutionItem {
  readonly source: ResolutionSourceType
  readonly sourceId?: string | null
  readonly amount: number
  readonly description: string
  readonly metadata?: Readonly<Record<string, unknown>>
}

export interface ResolutionResult {
  readonly items: readonly ResolutionItem[]
  readonly totalCovered: number
  readonly remainingAmount: number
  readonly fullyResolved: boolean
}

// ── Transformation Record (aggregate) ──────────────────────────────────────

export interface TransformationRecord {
  readonly id: string
  readonly companyId: string
  readonly subscriberId: string
  readonly subscriberKind: string
  readonly type: TransformationType
  readonly status: TransformationStatus

  readonly sourceBenefitId: string
  readonly sourceGrantId: string | null
  readonly targetBenefitId: string | null
  readonly targetGrantId: string | null

  readonly sourceValue: number | null
  readonly targetValue: number | null
  readonly differenceAmount: number | null
  readonly resolvedAmount: number | null

  readonly resolution: ResolutionResult | null
  readonly policyId: string | null
  readonly requiresApproval: boolean
  readonly approvedById: string | null
  readonly approvedAt: Date | null
  readonly rejectionReason: string | null

  readonly sucursalId: string | null
  readonly requestedById: string | null
  readonly config: Readonly<Record<string, unknown>>
  readonly metadata: Readonly<Record<string, unknown>>

  readonly createdAt: Date
  readonly updatedAt: Date
  readonly completedAt: Date | null
}

// ── Policy Config ──────────────────────────────────────────────────────────

export interface TransformationPolicySchedule {
  readonly allowedDays?: readonly string[]
  readonly allowedHoursFrom?: string | null
  readonly allowedHoursTo?: string | null
}

export interface TransformationPolicyLimits {
  readonly maxPerDay?: number | null
  readonly maxPerMonth?: number | null
  readonly maxPerMembership?: number | null
}

export interface TransformationPolicyFunding {
  readonly allowPayment?: boolean
  readonly allowPoints?: boolean
  readonly allowCredits?: boolean
  readonly allowCoupons?: boolean
  readonly allowPromotions?: boolean
  readonly allowCombinedMethods?: boolean
}

export interface TransformationPolicyConfig {
  readonly allowedSourceBenefits?: readonly string[]
  readonly allowedTargetBenefits?: readonly string[]
  readonly allowedPlans?: readonly string[]
  readonly allowedBranches?: readonly string[]
  readonly schedule?: TransformationPolicySchedule
  readonly limits?: TransformationPolicyLimits
  readonly funding?: TransformationPolicyFunding
  readonly requiresApproval?: boolean
  readonly requiresPayment?: boolean
  readonly generatesTax?: boolean
  readonly taxRate?: number | null
  readonly generatesCommission?: boolean
  readonly commissionRate?: number | null
  readonly updatesQr?: boolean
  readonly replacesOriginal?: boolean
  readonly createsNewGrant?: boolean
  readonly keepsBothGrants?: boolean
  readonly customRules?: readonly string[]
  readonly [extra: string]: unknown
}

export interface TransformationPolicy {
  readonly id: string
  readonly companyId: string
  readonly name: string
  readonly description: string | null
  readonly type: TransformationType
  readonly active: boolean
  readonly priority: number
  readonly config: TransformationPolicyConfig
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: Date
  readonly updatedAt: Date
}

// ── Request / Result ───────────────────────────────────────────────────────

export interface TransformationRequest {
  readonly companyId: string
  readonly subscriberId: string
  readonly subscriberKind?: string
  readonly type: TransformationType
  readonly sourceBenefitId: string
  readonly sourceGrantId?: string | null
  readonly targetBenefitId?: string | null
  readonly sucursalId?: string | null
  readonly requestedById?: string | null
  readonly config?: Record<string, unknown>
  readonly metadata?: Record<string, unknown>
}

export type TransformationResult =
  | { readonly ok: true; readonly transformation: TransformationRecord }
  | { readonly ok: false; readonly error: string; readonly code?: string }

// ── Audit ──────────────────────────────────────────────────────────────────

export type TransformationAuditAction =
  | 'REQUESTED'
  | 'RESOLVED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_REQUIRED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'

export interface TransformationAuditEntry {
  readonly transformationId: string
  readonly companyId: string
  readonly action: TransformationAuditAction
  readonly previousStatus: TransformationStatus | null
  readonly newStatus: TransformationStatus
  readonly userId?: string | null
  readonly details?: Readonly<Record<string, unknown>>
  readonly timestamp: Date
}
