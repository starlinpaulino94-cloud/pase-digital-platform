/**
 * PrismaPromotionRepository: adaptador del puerto PromotionRepository.
 *
 * Única pieza del framework que conoce Prisma. Traduce operaciones de dominio a
 * queries y filas a tipos de dominio (vía mappers). Sin lógica de negocio.
 */

import type { Prisma, PrismaClient, PromotionStatus } from '@prisma/client'
import type {
  Promotion,
  PromotionActionDef,
  PromotionRestrictionDef,
} from '../domain/types'
import type { PromotionAuditEntry } from '../domain/audit'
import type {
  CreatePromotionData,
  ListPromotionsQuery,
  PromotionRepository,
  PromotionVersionSnapshot,
  UpdatePromotionData,
} from '../application/ports'
import { mapPromotion } from './mappers'

const INCLUDE = { rules: true, actions: true, restrictions: true } as const

function asJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue)
}

export class PrismaPromotionRepository implements PromotionRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreatePromotionData): Promise<Promotion> {
    const row = await this.db.promotion.create({
      data: {
        companyId: data.companyId,
        nombre: data.name,
        descripcion: data.description ?? null,
        categoria: data.category ?? null,
        prioridad: data.priority ?? 0,
        inicioEn: data.startsAt ?? null,
        finEn: data.endsAt ?? null,
        config: asJson(data.config) ?? {},
        metadata: asJson(data.metadata) ?? {},
        creadoPorId: data.createdById ?? null,
      },
      include: INCLUDE,
    })
    return mapPromotion(row)
  }

  async update(id: string, data: UpdatePromotionData): Promise<Promotion> {
    const row = await this.db.promotion.update({
      where: { id },
      data: {
        nombre: data.name,
        descripcion: data.description,
        categoria: data.category,
        prioridad: data.priority,
        inicioEn: data.startsAt,
        finEn: data.endsAt,
        config: asJson(data.config),
        metadata: asJson(data.metadata),
        editadoPorId: data.updatedById,
      },
      include: INCLUDE,
    })
    return mapPromotion(row)
  }

  async findById(id: string): Promise<Promotion | null> {
    const row = await this.db.promotion.findUnique({ where: { id }, include: INCLUDE })
    return row ? mapPromotion(row) : null
  }

  async list(query: ListPromotionsQuery): Promise<Promotion[]> {
    const rows = await this.db.promotion.findMany({
      where: {
        companyId: query.companyId,
        status: query.status,
        categoria: query.category,
      },
      include: INCLUDE,
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
    })
    return rows.map(mapPromotion)
  }

  async setStatus(
    id: string,
    status: PromotionStatus,
    updatedById: string | null,
  ): Promise<Promotion> {
    const row = await this.db.promotion.update({
      where: { id },
      data: { status, editadoPorId: updatedById },
      include: INCLUDE,
    })
    return mapPromotion(row)
  }

  async bumpVersion(id: string): Promise<Promotion> {
    const row = await this.db.promotion.update({
      where: { id },
      data: { version: { increment: 1 } },
      include: INCLUDE,
    })
    return mapPromotion(row)
  }

  async setRules(id: string, ruleIds: string[]): Promise<Promotion> {
    await this.db.$transaction([
      this.db.promotionRule.deleteMany({ where: { promotionId: id } }),
      ...ruleIds.map((ruleId, index) =>
        this.db.promotionRule.create({ data: { promotionId: id, ruleId, orden: index } }),
      ),
    ])
    return this.requireById(id)
  }

  async setActions(id: string, actions: Omit<PromotionActionDef, 'id'>[]): Promise<Promotion> {
    await this.db.$transaction([
      this.db.promotionAction.deleteMany({ where: { promotionId: id } }),
      ...actions.map((a) =>
        this.db.promotionAction.create({
          data: {
            promotionId: id,
            tipo: a.type,
            params: asJson(a.params as Record<string, unknown>) ?? {},
            orden: a.order,
            obligatoria: a.required,
            maxReintentos: a.maxRetries,
            activa: a.enabled,
            version: a.version,
          },
        }),
      ),
    ])
    return this.requireById(id)
  }

  async setRestrictions(
    id: string,
    restrictions: Omit<PromotionRestrictionDef, 'id'>[],
  ): Promise<Promotion> {
    await this.db.$transaction([
      this.db.promotionRestriction.deleteMany({ where: { promotionId: id } }),
      ...restrictions.map((r) =>
        this.db.promotionRestriction.create({
          data: {
            promotionId: id,
            tipo: r.type,
            valor: r.value,
            config: asJson(r.config as Record<string, unknown>) ?? {},
            activa: r.enabled,
          },
        }),
      ),
    ])
    return this.requireById(id)
  }

  async saveVersion(snapshot: PromotionVersionSnapshot): Promise<void> {
    await this.db.promotionVersion.create({
      data: {
        promotionId: snapshot.promotionId,
        version: snapshot.version,
        snapshot: snapshot.snapshot as unknown as Prisma.InputJsonValue,
        resumen: snapshot.summary,
        creadoPorId: snapshot.createdById,
      },
    })
  }

  async recordAudit(entry: PromotionAuditEntry): Promise<void> {
    await this.db.promotionAudit.create({
      data: {
        promotionId: entry.promotionId,
        companyId: entry.companyId,
        userId: entry.userId,
        accion: entry.action,
        estadoAnterior: entry.previousStatus,
        estadoNuevo: entry.newStatus,
        cambios: entry.changes as unknown as Prisma.InputJsonValue,
      },
    })
  }

  private async requireById(id: string): Promise<Promotion> {
    const promotion = await this.findById(id)
    if (!promotion) throw new Error(`Promoción no encontrada tras la operación: ${id}`)
    return promotion
  }
}
