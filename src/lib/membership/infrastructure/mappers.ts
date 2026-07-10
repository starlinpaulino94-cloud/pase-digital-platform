/**
 * Mappers Prisma ↔ dominio del Membership Engine (Fase A).
 */

import type {
  MembershipPlan as PrismaPlan,
  MembershipInstance as PrismaInstance,
  MembershipUsage as PrismaUsage,
} from '@prisma/client'
import type {
  MembershipConfig,
  MembershipInstance,
  MembershipPlan,
  MembershipPlanStatus,
  MembershipUsageRecord,
  MembershipVehicle,
} from '../domain/types'

const PLAN_STATUSES: readonly MembershipPlanStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

function toPlanStatus(raw: string): MembershipPlanStatus {
  return (PLAN_STATUSES as readonly string[]).includes(raw) ? (raw as MembershipPlanStatus) : 'DRAFT'
}

export function mapPlan(row: PrismaPlan): MembershipPlan {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.nombre,
    description: row.descripcion,
    type: row.tipo,
    price: Number(row.precio),
    currency: row.moneda,
    periodicity: row.periodicidad,
    durationDays: row.duracionDias,
    credits: row.creditos,
    unlimited: row.ilimitado,
    templateKey: row.templateKey,
    config: (row.config ?? {}) as MembershipConfig,
    status: toPlanStatus(row.status),
    version: row.version,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function mapInstance(row: PrismaInstance): MembershipInstance {
  return {
    id: row.id,
    companyId: row.companyId,
    planId: row.planId,
    subscriberId: row.subscriberId,
    subscriberKind: row.subscriberKind,
    status: row.status,
    startsAt: row.inicioEn,
    endsAt: row.finEn,
    renewsAt: row.renuevaEn,
    autoRenew: row.autoRenovar,
    creditsRemaining: row.creditosRestantes,
    vehicles: (row.vehiculos ?? []) as unknown as MembershipVehicle[],
    config: (row.config ?? {}) as Record<string, unknown>,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function mapUsage(row: PrismaUsage): MembershipUsageRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    instanceId: row.instanceId,
    service: row.servicio,
    quantity: row.cantidad,
    vehicle: row.vehiculo,
    usedAt: row.usadoEn,
    meta: (row.meta ?? {}) as Record<string, unknown>,
  }
}
