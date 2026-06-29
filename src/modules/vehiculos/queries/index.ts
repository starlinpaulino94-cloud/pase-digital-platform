import { prisma } from '@/lib/prisma'
import type { Vehicle } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function getVehiclesByCustomer(customerId: string): Promise<Vehicle[]> {
  return db.vehicle.findMany({
    where: { customerId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  return db.vehicle.findUnique({ where: { id } })
}

export async function getDefaultVehicle(customerId: string): Promise<Vehicle | null> {
  return db.vehicle.findFirst({
    where: { customerId, isDefault: true },
  })
}
