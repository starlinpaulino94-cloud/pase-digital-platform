/**
 * Puertos del Membership Engine (Fase A). El servicio depende de estas
 * abstracciones, no de Prisma.
 */

import type {
  MembershipConfig,
  MembershipInstance,
  MembershipInstanceStatus,
  MembershipPeriodicity,
  MembershipPlan,
  MembershipPlanStatus,
  MembershipPlanType,
  MembershipUsageRecord,
  MembershipVehicle,
} from '../domain/types'

export interface CreatePlanData {
  readonly companyId: string
  readonly name: string
  readonly description?: string | null
  readonly type: MembershipPlanType
  readonly price: number
  readonly currency?: string
  readonly periodicity?: MembershipPeriodicity
  readonly durationDays?: number | null
  readonly credits?: number | null
  readonly unlimited?: boolean
  readonly templateKey?: string | null
  readonly config?: MembershipConfig
  readonly metadata?: Record<string, unknown>
}

export interface UpdatePlanData {
  readonly name?: string
  readonly description?: string | null
  readonly price?: number
  readonly periodicity?: MembershipPeriodicity
  readonly durationDays?: number | null
  readonly credits?: number | null
  readonly unlimited?: boolean
  readonly config?: MembershipConfig
  readonly status?: MembershipPlanStatus
  readonly metadata?: Record<string, unknown>
}

export interface SubscribeData {
  readonly companyId: string
  readonly planId: string
  readonly subscriberId: string
  readonly subscriberKind?: string
  readonly startsAt?: Date
  readonly autoRenew?: boolean
  readonly vehicles?: MembershipVehicle[]
  readonly config?: Record<string, unknown>
}

export interface MembershipRepository {
  createPlan(data: CreatePlanData): Promise<MembershipPlan>
  updatePlan(id: string, data: UpdatePlanData): Promise<MembershipPlan>
  findPlan(id: string): Promise<MembershipPlan | null>
  listPlans(companyId: string): Promise<MembershipPlan[]>

  createInstance(data: {
    companyId: string
    planId: string
    subscriberId: string
    subscriberKind: string
    status: MembershipInstanceStatus
    startsAt: Date | null
    endsAt: Date | null
    renewsAt: Date | null
    autoRenew: boolean
    creditsRemaining: number | null
    vehicles: MembershipVehicle[]
    config: Record<string, unknown>
  }): Promise<MembershipInstance>
  findInstance(id: string): Promise<MembershipInstance | null>
  updateInstance(
    id: string,
    data: Partial<{
      status: MembershipInstanceStatus
      planId: string
      startsAt: Date | null
      endsAt: Date | null
      renewsAt: Date | null
      autoRenew: boolean
      creditsRemaining: number | null
      vehicles: MembershipVehicle[]
    }>,
  ): Promise<MembershipInstance>

  recordUsage(data: {
    companyId: string
    instanceId: string
    service: string
    quantity: number
    vehicle: string | null
    usedAt: Date
    meta: Record<string, unknown>
  }): Promise<MembershipUsageRecord>
  /** Usos recientes de una instancia (desde `since`), para evaluar límites. */
  recentUsage(instanceId: string, since: Date): Promise<MembershipUsageRecord[]>
}
