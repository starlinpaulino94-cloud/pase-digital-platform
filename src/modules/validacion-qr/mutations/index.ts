import { prisma } from '@/lib/prisma'
import { writeAuditLog } from '@/modules/empresas/mutations'
import { consumeUse } from '@/modules/asignaciones/mutations'
import type { ValidationSession, Receipt } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const VALIDATION_INCLUDE = {
  digitalPass: { select: { id: true, token: true, isActive: true } },
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: { select: { email: true } },
    },
  },
  promotionAssignment: {
    select: {
      id: true,
      status: true,
      usesConsumed: true,
      usesAllowed: true,
      promotion: { select: { id: true, name: true, type: true } },
    },
  },
  receipt: true,
}

// ─── Scan ─────────────────────────────────────────────────────────────────────
// Records that a QR was scanned. Idempotent via sessionId.
// Does NOT consume any use or assignment.

export async function scanQR(params: {
  token: string
  companyId: string
  branchId?: string | null
  employeeId?: string | null
  employeeRecordId?: string | null
  sessionId?: string
}): Promise<{ validation: ValidationSession; alreadyScanned: boolean }> {
  const { token, companyId, branchId, employeeId, employeeRecordId, sessionId } = params

  // Resolve pass by token
  const pass = await db.digitalPass.findUnique({
    where: { token },
    include: {
      customer: {
        select: { id: true, status: true },
      },
    },
  })

  if (!pass) throw new Error('Pase Digital no encontrado')
  if (!pass.isActive) throw new Error('El Pase Digital no está activo')
  if (pass.customer?.status !== 'ACTIVE') throw new Error('El cliente no está activo')

  // Idempotency: if sessionId already exists, return existing
  if (sessionId) {
    const existing = await db.validation.findUnique({
      where: { sessionId },
      include: VALIDATION_INCLUDE,
    })
    if (existing) return { validation: existing, alreadyScanned: true }
  }

  const validation = await db.validation.create({
    data: {
      digitalPassId: pass.id,
      customerId: pass.customerId,
      companyId,
      branchId: branchId ?? null,
      employeeId: employeeId ?? null,
      employeeRecordId: employeeRecordId ?? null,
      status: 'SCANNED',
      scannedAt: new Date(),
      ...(sessionId ? { sessionId } : {}),
    },
    include: VALIDATION_INCLUDE,
  })

  await writeAuditLog({
    companyId,
    userId: employeeId ?? undefined,
    event: 'QR_SCANNED',
    entityType: 'Validation',
    entityId: validation.id,
    payload: { token: token.slice(0, 8) + '...', customerId: pass.customerId },
  })

  return { validation, alreadyScanned: false }
}

// ─── Evaluate ─────────────────────────────────────────────────────────────────
// Marks the validation as EVALUATED after showing the employee what assignments exist.
// Still does NOT consume anything.

export async function evaluateValidation(
  validationId: string,
  companyId: string,
  employeeId?: string
): Promise<ValidationSession> {
  const v = await db.validation.findUnique({ where: { id: validationId } })
  if (!v) throw new Error('Validación no encontrada')
  if (v.status !== 'SCANNED') throw new Error('La validación ya fue procesada')

  const updated = await db.validation.update({
    where: { id: validationId },
    data: { status: 'EVALUATED', evaluatedAt: new Date() },
    include: VALIDATION_INCLUDE,
  })

  await writeAuditLog({
    companyId: companyId ?? v.companyId,
    userId: employeeId,
    event: 'QR_EVALUATED',
    entityType: 'Validation',
    entityId: validationId,
    payload: {},
  })

  return updated
}

// ─── Confirm ──────────────────────────────────────────────────────────────────
// The employee explicitly confirms which promotion assignment to consume.
// THIS is where consumption happens — not on scan.

export async function confirmValidation(params: {
  validationId: string
  assignmentId: string
  externalInvoiceId?: string | null
  externalInvoiceUrl?: string | null
  companyId: string
  employeeId?: string
}): Promise<{ validation: ValidationSession; receipt: Receipt }> {
  const { validationId, assignmentId, externalInvoiceId, externalInvoiceUrl, companyId, employeeId } = params

  const v = await db.validation.findUnique({ where: { id: validationId } })
  if (!v) throw new Error('Validación no encontrada')
  if (!['SCANNED', 'EVALUATED'].includes(v.status)) {
    throw new Error('La validación ya fue confirmada, rechazada o cancelada')
  }

  // Verify assignment belongs to this company and customer
  const assignment = await db.promotionAssignment.findFirst({
    where: {
      id: assignmentId,
      customerId: v.customerId,
      companyId,
      status: 'ACTIVE',
    },
  })
  if (!assignment) throw new Error('Asignación no encontrada o no está activa')

  // Consume use on the assignment — this auto-completes if exhausted
  await consumeUse(assignmentId, employeeId, companyId)

  // Update validation → CONFIRMED, link assignment
  const updatedValidation = await db.validation.update({
    where: { id: validationId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      promotionAssignmentId: assignmentId,
      evaluatedAt: v.evaluatedAt ?? new Date(),
    },
    include: VALIDATION_INCLUDE,
  })

  // Create receipt
  const receipt = await db.receipt.create({
    data: {
      validationId,
      customerId: v.customerId,
      promotionAssignmentId: assignmentId,
      companyId,
      externalInvoiceId: externalInvoiceId ?? null,
      externalInvoiceUrl: externalInvoiceUrl ?? null,
      status: 'ISSUED',
      issuedAt: new Date(),
    },
  })

  await writeAuditLog({
    companyId,
    userId: employeeId,
    event: 'QR_CONFIRMED',
    entityType: 'Validation',
    entityId: validationId,
    payload: { assignmentId, receiptId: receipt.id },
  })

  return { validation: updatedValidation, receipt }
}

// ─── Reject ───────────────────────────────────────────────────────────────────
// The employee rejects the validation (invalid QR, wrong promotion, etc.)
// Nothing is consumed.

export async function rejectValidation(
  validationId: string,
  reason: string,
  companyId: string,
  employeeId?: string
): Promise<ValidationSession> {
  const v = await db.validation.findUnique({ where: { id: validationId } })
  if (!v) throw new Error('Validación no encontrada')
  if (!['SCANNED', 'EVALUATED'].includes(v.status)) {
    throw new Error('La validación ya fue procesada')
  }

  const updated = await db.validation.update({
    where: { id: validationId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason: reason,
      evaluatedAt: v.evaluatedAt ?? new Date(),
    },
    include: VALIDATION_INCLUDE,
  })

  await writeAuditLog({
    companyId: companyId ?? v.companyId,
    userId: employeeId,
    event: 'QR_REJECTED',
    entityType: 'Validation',
    entityId: validationId,
    payload: { reason },
  })

  return updated
}
