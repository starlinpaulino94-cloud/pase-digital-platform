import { z } from 'zod'

const currentYear = new Date().getFullYear()

export const createVehicleSchema = z.object({
  make: z.string().min(1, 'La marca es requerida').max(50),
  model: z.string().min(1, 'El modelo es requerido').max(50),
  year: z.coerce.number().int().min(1950).max(currentYear + 1),
  color: z.string().min(1, 'El color es requerido').max(30),
  plate: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
})

export const updateVehicleSchema = createVehicleSchema.partial()
