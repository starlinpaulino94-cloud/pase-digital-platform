import { z } from 'zod'

const PHONE_REGEX = /^[\d\s\-\+\(\)]{7,20}$/

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(80),
  lastName: z.string().min(1, 'El apellido es requerido').max(80),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
})

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
})

export type CreateCustomerValues = z.infer<typeof createCustomerSchema>
export type UpdateCustomerValues = z.infer<typeof updateCustomerSchema>
