/**
 * Mappers Prisma ↔ dominio del Framework de Promociones (Fase 4).
 */

import type {
  Promotion as PrismaPromotion,
  PromotionRule as PrismaPromotionRule,
  PromotionAction as PrismaPromotionAction,
  PromotionRestriction as PrismaPromotionRestriction,
} from '@prisma/client'
import type {
  Promotion,
  PromotionActionDef,
  PromotionRestrictionDef,
  PromotionRuleRef,
} from '../domain/types'

export type PrismaPromotionWithRelations = PrismaPromotion & {
  rules: PrismaPromotionRule[]
  actions: PrismaPromotionAction[]
  restrictions: PrismaPromotionRestriction[]
}

function mapRuleRef(row: PrismaPromotionRule): PromotionRuleRef {
  return { id: row.id, ruleId: row.ruleId, order: row.orden }
}

function mapAction(row: PrismaPromotionAction): PromotionActionDef {
  return {
    id: row.id,
    type: row.tipo,
    params: (row.params ?? {}) as Record<string, unknown>,
    order: row.orden,
    required: row.obligatoria,
    maxRetries: row.maxReintentos,
    enabled: row.activa,
    version: row.version,
  }
}

function mapRestriction(row: PrismaPromotionRestriction): PromotionRestrictionDef {
  return {
    id: row.id,
    type: row.tipo,
    value: row.valor,
    config: (row.config ?? {}) as Record<string, unknown>,
    enabled: row.activa,
  }
}

export function mapPromotion(row: PrismaPromotionWithRelations): Promotion {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.nombre,
    description: row.descripcion,
    category: row.categoria,
    status: row.status,
    priority: row.prioridad,
    startsAt: row.inicioEn,
    endsAt: row.finEn,
    config: (row.config ?? {}) as Record<string, unknown>,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    version: row.version,
    createdById: row.creadoPorId,
    updatedById: row.editadoPorId,
    rules: row.rules.map(mapRuleRef).sort((a, b) => a.order - b.order),
    actions: row.actions.map(mapAction).sort((a, b) => a.order - b.order),
    restrictions: row.restrictions.map(mapRestriction),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
