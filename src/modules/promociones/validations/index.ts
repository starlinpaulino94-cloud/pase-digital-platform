import { z } from 'zod'

const PROMOTION_TYPES = [
  'COUPON',
  'DISCOUNT',
  'PLAN',
  'MEMBERSHIP',
  'VISIT_BASED',
  'TEMPORARY_OFFER',
  'BUNDLE',
  'CASHBACK',
  'REFERRAL',
] as const

export const createPromotionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  type: z.enum(PROMOTION_TYPES, { message: 'Tipo de promoción inválido' }),
  config: z.record(z.string(), z.unknown()).default({}),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.startsAt && data.expiresAt && data.expiresAt <= data.startsAt) {
    ctx.addIssue({
      code: 'custom',
      message: 'La fecha de expiración debe ser posterior a la fecha de inicio',
      path: ['expiresAt'],
    })
  }
})

export const updatePromotionSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  config: z.record(z.string(), z.unknown()).optional(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.startsAt && data.expiresAt && data.expiresAt <= data.startsAt) {
    ctx.addIssue({
      code: 'custom',
      message: 'La fecha de expiración debe ser posterior a la fecha de inicio',
      path: ['expiresAt'],
    })
  }
})

export type CreatePromotionValues = z.infer<typeof createPromotionSchema>
export type UpdatePromotionValues = z.infer<typeof updatePromotionSchema>
