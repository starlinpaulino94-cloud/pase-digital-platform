import { z } from 'zod'

export const scanSchema = z.object({
  token: z.string().min(1, 'El token QR es requerido').max(64),
  companyId: z.string().min(1, 'companyId es requerido'),
  branchId: z.string().optional().nullable(),
})

export const SERVICE_TYPES = ['BASIC', 'PREMIUM', 'SPECIAL', 'OTHER'] as const
export type ServiceType = (typeof SERVICE_TYPES)[number]

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  BASIC: 'Lavado básico',
  PREMIUM: 'Lavado premium',
  SPECIAL: 'Lavado especial',
  OTHER: 'Otro',
}

export const confirmSchema = z.object({
  validationId: z.string().min(1),
  assignmentId: z.string().min(1, 'Debe seleccionar una promoción a confirmar'),
  serviceType: z.enum(SERVICE_TYPES, { error: 'Debe seleccionar el tipo de servicio' }),
  vehicleId: z.string().optional().nullable(),
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
