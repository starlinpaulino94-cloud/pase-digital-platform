import { prisma } from '@/lib/prisma'
import type { Vehicle, CreateVehicleInput, UpdateVehicleInput } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function createVehicle(
  customerId: string,
  data: CreateVehicleInput
): Promise<Vehicle> {
  const isFirst = (await db.vehicle.count({ where: { customerId } })) === 0
  // If this is the first vehicle or explicitly set as default, unset others first
  if (data.isDefault || isFirst) {
    await db.vehicle.updateMany({
      where: { customerId, isDefault: true },
      data: { isDefault: false },
    })
  }
  return db.vehicle.create({
    data: {
      customerId,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color,
      plate: data.plate ?? null,
      isDefault: data.isDefault || isFirst,
    },
  })
}

export async function updateVehicle(id: string, data: UpdateVehicleInput): Promise<Vehicle> {
  if (data.isDefault) {
    const vehicle = await db.vehicle.findUnique({ where: { id } })
    if (vehicle) {
      await db.vehicle.updateMany({
        where: { customerId: vehicle.customerId, isDefault: true },
        data: { isDefault: false },
      })
    }
  }
  return db.vehicle.update({
    where: { id },
    data: {
      ...(data.make !== undefined && { make: data.make }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.year !== undefined && { year: data.year }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.plate !== undefined && { plate: data.plate || null }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    },
  })
}

export async function deleteVehicle(id: string): Promise<void> {
  const vehicle = await db.vehicle.findUnique({ where: { id } })
  if (!vehicle) throw new Error('Vehículo no encontrado')

  await db.vehicle.delete({ where: { id } })

  // If it was the default, promote the next one
  if (vehicle.isDefault) {
    const next = await db.vehicle.findFirst({ where: { customerId: vehicle.customerId } })
    if (next) await db.vehicle.update({ where: { id: next.id }, data: { isDefault: true } })
  }
}

export async function setDefaultVehicle(id: string, customerId: string): Promise<Vehicle> {
  await db.vehicle.updateMany({
    where: { customerId, isDefault: true },
    data: { isDefault: false },
  })
  return db.vehicle.update({ where: { id }, data: { isDefault: true } })
}
