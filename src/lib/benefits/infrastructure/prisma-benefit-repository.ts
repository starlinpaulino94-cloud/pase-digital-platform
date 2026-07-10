/**
 * PrismaBenefitRepository: adaptador del puerto BenefitRepository.
 * Única pieza del Benefit Engine que conoce Prisma.
 */

import type { Prisma, PrismaClient } from '@prisma/client'
import type { Benefit, BenefitGrant, BenefitGrantStatus } from '../domain/types'
import type {
  BenefitRepository,
  CreateBenefitData,
  UpdateBenefitData,
} from '../application/ports'
import { mapBenefit, mapGrant } from './mappers'

function json(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue
}

export class PrismaBenefitRepository implements BenefitRepository {
  constructor(private readonly db: PrismaClient) {}

  async createBenefit(data: CreateBenefitData): Promise<Benefit> {
    const row = await this.db.benefit.create({
      data: {
        companyId: data.companyId,
        code: data.code ?? null,
        nombre: data.name,
        descripcion: data.description ?? null,
        categoria: data.category,
        tipo: data.type,
        valorPercibido: data.perceivedValue ?? null,
        costoReal: data.realCost ?? null,
        templateKey: data.templateKey ?? null,
        config: json(data.config),
        metadata: json(data.metadata),
      },
    })
    return mapBenefit(row)
  }

  async updateBenefit(id: string, data: UpdateBenefitData): Promise<Benefit> {
    const row = await this.db.benefit.update({
      where: { id },
      data: {
        nombre: data.name,
        descripcion: data.description,
        categoria: data.category,
        valorPercibido: data.perceivedValue,
        costoReal: data.realCost,
        config: data.config === undefined ? undefined : json(data.config),
        status: data.status,
        metadata: data.metadata === undefined ? undefined : json(data.metadata),
      },
    })
    return mapBenefit(row)
  }

  async findBenefit(id: string): Promise<Benefit | null> {
    const row = await this.db.benefit.findUnique({ where: { id } })
    return row ? mapBenefit(row) : null
  }

  async listBenefits(
    companyId: string,
    filter?: { status?: Benefit['status']; category?: string; type?: Benefit['type'] },
  ): Promise<Benefit[]> {
    const rows = await this.db.benefit.findMany({
      where: {
        companyId,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.category ? { categoria: filter.category } : {}),
        ...(filter?.type ? { tipo: filter.type } : {}),
      },
      orderBy: [{ categoria: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map(mapBenefit)
  }

  async createGrant(data: {
    companyId: string
    benefitId: string
    subscriberId: string
    subscriberKind: string
    sourceModule: string
    status: BenefitGrantStatus
    grantedAt: Date
    expiresAt: Date | null
    meta: Record<string, unknown>
  }): Promise<BenefitGrant> {
    const row = await this.db.benefitGrant.create({
      data: {
        companyId: data.companyId,
        benefitId: data.benefitId,
        subscriberId: data.subscriberId,
        subscriberKind: data.subscriberKind,
        sourceModule: data.sourceModule,
        status: data.status,
        grantedAt: data.grantedAt,
        expiresAt: data.expiresAt,
        meta: json(data.meta),
      },
    })
    return mapGrant(row)
  }

  async findGrant(id: string): Promise<BenefitGrant | null> {
    const row = await this.db.benefitGrant.findUnique({ where: { id } })
    return row ? mapGrant(row) : null
  }

  async updateGrantStatus(
    id: string,
    status: BenefitGrantStatus,
    redeemedAt: Date | null,
  ): Promise<BenefitGrant> {
    const row = await this.db.benefitGrant.update({
      where: { id },
      data: { status, redeemedAt },
    })
    return mapGrant(row)
  }

  countGrants(
    benefitId: string,
    subscriberId: string,
    status: BenefitGrantStatus,
    since?: Date,
  ): Promise<number> {
    return this.db.benefitGrant.count({
      where: {
        benefitId,
        subscriberId,
        status,
        ...(since ? { grantedAt: { gte: since } } : {}),
      },
    })
  }

  countRedeemed(benefitId: string): Promise<number> {
    return this.db.benefitGrant.count({
      where: { benefitId, status: 'REDEEMED' },
    })
  }
}
