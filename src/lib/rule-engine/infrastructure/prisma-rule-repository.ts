/**
 * PrismaRuleRepository: adaptador del puerto RuleRepository sobre Prisma.
 *
 * Es la ÚNICA pieza del motor que conoce Prisma. Traduce las consultas del
 * dominio a queries y las filas resultantes a tipos de dominio (vía mappers).
 * No contiene lógica de evaluación ni de negocio.
 */

import type { PrismaClient } from '@prisma/client'
import type { Rule, RuleStatus } from '../domain/types'
import type {
  FindApplicableRulesQuery,
  RuleRepository,
} from '../application/ports'
import { mapRule } from './mappers'

/**
 * `include` reutilizable: condiciones, grupos de condiciones (para reconstruir
 * el árbol), acciones y grupo funcional.
 */
const RULE_INCLUDE = {
  conditions: true,
  conditionGroups: true,
  actions: true,
  group: true,
} as const

export class PrismaRuleRepository implements RuleRepository {
  constructor(private readonly db: PrismaClient) {}

  async findApplicable(query: FindApplicableRulesQuery): Promise<Rule[]> {
    const rows = await this.db.rule.findMany({
      where: {
        companyId: query.companyId,
        status: 'PUBLISHED',
        activo: true,
        // Ventana de vigencia: validoDesde <= at <= validoHasta (null = sin límite).
        AND: [
          { OR: [{ validoDesde: null }, { validoDesde: { lte: query.at } }] },
          { OR: [{ validoHasta: null }, { validoHasta: { gte: query.at } }] },
        ],
        ...(query.groupKey
          ? { group: { is: { key: query.groupKey, activo: true } } }
          : {}),
      },
      include: RULE_INCLUDE,
      orderBy: { prioridad: 'desc' },
    })
    return rows.map(mapRule)
  }

  async findById(id: string): Promise<Rule | null> {
    const row = await this.db.rule.findUnique({
      where: { id },
      include: RULE_INCLUDE,
    })
    return row ? mapRule(row) : null
  }

  async listByCompany(companyId: string): Promise<Rule[]> {
    const rows = await this.db.rule.findMany({
      where: { companyId },
      include: RULE_INCLUDE,
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
    })
    return rows.map(mapRule)
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    // Cada cambio incrementa la versión: base para el versionado de reglas.
    await this.db.rule.update({
      where: { id },
      data: { activo: isActive, version: { increment: 1 } },
    })
  }

  async setStatus(id: string, status: RuleStatus): Promise<void> {
    await this.db.rule.update({
      where: { id },
      data: { status, version: { increment: 1 } },
    })
  }
}
