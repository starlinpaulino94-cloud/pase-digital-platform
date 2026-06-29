export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'

export interface CustomerUser {
  id: string
  email: string
  name: string
  phone: string | null
  avatarUrl: string | null
}

export interface DigitalPass {
  id: string
  customerId: string
  token: string
  isActive: boolean
  activatedAt: Date | null
  expiresAt: Date | null
  revokedAt: Date | null
  revokedReason: string | null
  createdAt: Date
}

export interface CustomerCompanyLink {
  id: string
  customerId: string
  companyId: string
  totalVisits: number
  firstVisitAt: Date | null
  lastVisitAt: Date | null
  createdAt: Date
  company?: { id: string; name: string; industry: string }
}

export interface Customer {
  id: string
  userId: string
  firstName: string
  lastName: string
  phone: string | null
  birthDate: Date | string | null
  status: CustomerStatus
  createdAt: Date
  updatedAt: Date
  user: CustomerUser
  digitalPasses?: DigitalPass[]
  customerCompanies?: CustomerCompanyLink[]
  vehicles?: import('@/modules/vehiculos/types').Vehicle[]
}

export interface CreateCustomerInput {
  companyId?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  birthDate?: string
}

export interface UpdateCustomerInput {
  firstName?: string
  lastName?: string
  phone?: string
  birthDate?: string | null
}
