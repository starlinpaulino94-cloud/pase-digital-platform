export interface Vehicle {
  id: string
  customerId: string
  make: string
  model: string
  year: number
  color: string
  plate: string | null
  isDefault: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateVehicleInput {
  make: string
  model: string
  year: number
  color: string
  plate?: string
  isDefault?: boolean
}

export interface UpdateVehicleInput {
  make?: string
  model?: string
  year?: number
  color?: string
  plate?: string
  isDefault?: boolean
}
