import { z } from 'zod'

export const scanSchema = z.object({
  token: z.string().min(1, 'El token QR es requerido').max(64),
  companyId: z.string().min(1, 'companyId es requerido'),
  branchId: z.string().optional().nullable(),
})

export const confirmSchema = z.object({
  validationId: z.string().min(1),
  assignmentId: z.string().min(1, 'Debe seleccionar una promoción a confirmar'),
  externalInvoiceId: z.string().max(100).optional().nullable(),
  externalInvoiceUrl: z.string().url().optional().nullable(),
})

export const rejectSchema = z.object({
  validationId: z.string().min(1),
  reason: z.string().min(1, 'El motivo de rechazo es requerido').max(500),
})

export type ScanValues = z.infer<typeof scanSchema>
export type ConfirmValues = z.infer<typeof confirmSchema>
export type RejectValues = z.infer<typeof rejectSchema>
