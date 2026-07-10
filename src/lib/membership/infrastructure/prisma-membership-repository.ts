/**
 * PrismaMembershipRepository: adaptador del puerto MembershipRepository.
 * Única pieza del motor que conoce Prisma.
 */

import type { Prisma, PrismaClient } from '@prisma/client'
import type {
  MembershipInstance,
  MembershipInstanceStatus,
  MembershipPlan,
  MembershipUsageRecord,
  MembershipVehicle,
} from '../domain/types'
import type {
  CreatePlanData,
  MembershipRepository,
  UpdatePlanData,
} from '../application/ports'
import { mapInstance, mapPlan, mapUsage } from './mappers'

function json(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue
}

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly db: PrismaClient) {}

  async createPlan(data: CreatePlanData): Promise<MembershipPlan> {
    const row = await this.db.membershipPlan.create({
      data: {
        companyId: data.companyId,
        nombre: data.name,
        descripcion: data.description ?? null,
        tipo: data.type,
        precio: data.price,
        moneda: data.currency ?? 'DOP',
        periodicidad: data.periodicity ?? 'MONTHLY',
        duracionDias: data.durationDays ?? null,
        creditos: data.credits ?? null,
        ilimitado: data.unlimited ?? false,
        templateKey: data.templateKey ?? null,
        config: json(data.config),
        metadata: json(data.metadata),
      },
    })
    return mapPlan(row)
  }

  async updatePlan(id: string, data: UpdatePlanData): Promise<MembershipPlan> {
    const row = await this.db.membershipPlan.update({
      where: { id },
      data: {
        nombre: data.name,
        descripcion: data.description,
        precio: data.price,
        periodicidad: data.periodicity,
        duracionDias: data.durationDays,
        creditos: data.credits,
        ilimitado: data.unlimited,
        config: data.config ? json(data.config) : undefined,
        status: data.status,
        metadata: data.metadata ? json(data.metadata) : undefined,
        version: { increment: 1 },
      },
    })
    return mapPlan(row)
  }

  async findPlan(id: string): Promise<MembershipPlan | null> {
    const row = await this.db.membershipPlan.findUnique({ where: { id } })
    return row ? mapPlan(row) : null
  }

  async listPlans(companyId: string): Promise<MembershipPlan[]> {
    const rows = await this.db.membershipPlan.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(mapPlan)
  }

  async createInstance(data: {
    companyId: string; planId: string; subscriberId: string; subscriberKind: string
    status: MembershipInstanceStatus; startsAt: Date | null; endsAt: Date | null
    renewsAt: Date | null; autoRenew: boolean; creditsRemaining: number | null
    vehicles: MembershipVehicle[]; config: Record<string, unknown>
  }): Promise<MembershipInstance> {
    const row = await this.db.membershipInstance.create({
      data: {
        companyId: data.companyId,
        planId: data.planId,
        subscriberId: data.subscriberId,
        subscriberKind: data.subscriberKind,
        status: data.status,
        inicioEn: data.startsAt,
        finEn: data.endsAt,
        renuevaEn: data.renewsAt,
        autoRenovar: data.autoRenew,
        creditosRestantes: data.creditsRemaining,
        vehiculos: json(data.vehicles),
        config: json(data.config),
      },
    })
    return mapInstance(row)
  }

  async findInstance(id: string): Promise<MembershipInstance | null> {
    const row = await this.db.membershipInstance.findUnique({ where: { id } })
    return row ? mapInstance(row) : null
  }

  async updateInstance(
    id: string,
    data: Partial<{
      status: MembershipInstanceStatus; planId: string; startsAt: Date | null
      endsAt: Date | null; renewsAt: Date | null; autoRenew: boolean
      creditsRemaining: number | null; vehicles: MembershipVehicle[]
    }>,
  ): Promise<MembershipInstance> {
    const row = await this.db.membershipInstance.update({
      where: { id },
      data: {
        status: data.status,
        planId: data.planId,
        inicioEn: data.startsAt,
        finEn: data.endsAt,
        renuevaEn: data.renewsAt,
        autoRenovar: data.autoRenew,
        creditosRestantes: data.creditsRemaining,
        vehiculos: data.vehicles ? json(data.vehicles) : undefined,
      },
    })
    return mapInstance(row)
  }

  async recordUsage(data: {
    companyId: string; instanceId: string; service: string; quantity: number
    vehicle: string | null; usedAt: Date; meta: Record<string, unknown>
  }): Promise<MembershipUsageRecord> {
    const row = await this.db.membershipUsage.create({
      data: {
        companyId: data.companyId,
        instanceId: data.instanceId,
        servicio: data.service,
        cantidad: data.quantity,
        vehiculo: data.vehicle,
        usadoEn: data.usedAt,
        meta: json(data.meta),
      },
    })
    return mapUsage(row)
  }

  async recentUsage(instanceId: string, since: Date): Promise<MembershipUsageRecord[]> {
    const rows = await this.db.membershipUsage.findMany({
      where: { instanceId, usadoEn: { gte: since } },
      orderBy: { usadoEn: 'desc' },
    })
    return rows.map(mapUsage)
  }
}
