'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId } from '@/modules/clientes/queries'
import { createVehicle, updateVehicle, deleteVehicle, setDefaultVehicle } from '../mutations'
import { getVehicleById } from '../queries'
import { createVehicleSchema, updateVehicleSchema } from '../validations'
import type { ActionResult } from '@/types/auth'
import type { Vehicle } from '../types'

async function resolveCustomerId(): Promise<string> {
  const session = await getSession()
  if (!session) throw new Error('No autorizado')
  const customer = await getCustomerByUserId(session.dbUserId!)
  if (!customer) throw new Error('Perfil de cliente no encontrado')
  return customer.id
}

export async function createVehicleAction(
  _prev: ActionResult<Vehicle>,
  formData: FormData
): Promise<ActionResult<Vehicle>> {
  try {
    const customerId = await resolveCustomerId()
    const raw = {
      make: formData.get('make'),
      model: formData.get('model'),
      year: formData.get('year'),
      color: formData.get('color'),
      plate: formData.get('plate') || undefined,
      isDefault: formData.get('isDefault') === 'on',
    }
    const parsed = createVehicleSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }
    const vehicle = await createVehicle(customerId, parsed.data)
    revalidatePath('/profile/vehiculos')
    return { success: true, data: vehicle }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function updateVehicleAction(
  vehicleId: string,
  _prev: ActionResult<Vehicle>,
  formData: FormData
): Promise<ActionResult<Vehicle>> {
  try {
    const customerId = await resolveCustomerId()
    const vehicle = await getVehicleById(vehicleId)
    if (!vehicle || vehicle.customerId !== customerId) throw new Error('No autorizado')

    const raw = {
      make: formData.get('make') || undefined,
      model: formData.get('model') || undefined,
      year: formData.get('year') || undefined,
      color: formData.get('color') || undefined,
      plate: formData.get('plate') || undefined,
      isDefault: formData.get('isDefault') === 'on' ? true : undefined,
    }
    const parsed = updateVehicleSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
    }
    const updated = await updateVehicle(vehicleId, parsed.data)
    revalidatePath('/profile/vehiculos')
    return { success: true, data: updated }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function deleteVehicleAction(vehicleId: string): Promise<ActionResult> {
  try {
    const customerId = await resolveCustomerId()
    const vehicle = await getVehicleById(vehicleId)
    if (!vehicle || vehicle.customerId !== customerId) throw new Error('No autorizado')
    await deleteVehicle(vehicleId)
    revalidatePath('/profile/vehiculos')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function setDefaultVehicleAction(vehicleId: string): Promise<ActionResult> {
  try {
    const customerId = await resolveCustomerId()
    const vehicle = await getVehicleById(vehicleId)
    if (!vehicle || vehicle.customerId !== customerId) throw new Error('No autorizado')
    await setDefaultVehicle(vehicleId, customerId)
    revalidatePath('/profile/vehiculos')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}
