export type ValidationStatus =
  | 'SCANNED'
  | 'EVALUATED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'

export type ReceiptStatus = 'PENDING' | 'ISSUED' | 'VOIDED'

export interface ValidationSession {
  id: string
  sessionId: string
  digitalPassId: string
  customerId: string
  promotionAssignmentId?: string | null
  companyId: string
  branchId?: string | null
  employeeId?: string | null
  employeeRecordId?: string | null
  status: ValidationStatus
  scannedAt: Date | string
  evaluatedAt?: Date | string | null
  confirmedAt?: Date | string | null
  rejectedAt?: Date | string | null
  rejectionReason?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: Date | string
  updatedAt: Date | string
  // Relations
  digitalPass?: { id: string; token: string; isActive: boolean }
  customer?: {
    id: string
    firstName: string
    lastName: string
    user: { email: string }
  }
  promotionAssignment?: {
    id: string
    status: string
    usesConsumed: number
    usesAllowed: number | null
    promotion: { id: string; name: string; type: string }
  } | null
  receipt?: Receipt | null
}

export interface Receipt {
  id: string
  validationId: string
  customerId: string
  promotionAssignmentId: string
  companyId: string
  externalInvoiceId?: string | null
  externalInvoiceUrl?: string | null
  status: ReceiptStatus
  issuedAt?: Date | string | null
  voidedAt?: Date | string | null
  voidReason?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// Result returned when a QR token is evaluated
export interface EvaluationResult {
  validation: ValidationSession
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    status: string
  }
  activeAssignments: Array<{
    id: string
    promotionId: string
    promotionName: string
    promotionType: string
    status: string
    usesConsumed: number
    usesAllowed: number | null
    progress: number
    progressTarget: number | null
    expiresAt: string | null
  }>
}
