/**
 * Mappers: traducen las filas de Prisma a los tipos PUROS del dominio.
 *
 * Aíslan el núcleo del detalle de persistencia. En Fase 2 además reconstruyen el
 * ÁRBOL de condiciones a partir de las filas planas de `rule_condition_groups` y
 * `rule_conditions` (enlazadas por `parentId`/`groupId`), en memoria.
 */

import type {
  Rule as PrismaRule,
  RuleCondition as PrismaCondition,
  RuleAction as PrismaAction,
  RuleGroup as PrismaGroup,
  RuleConditionGroup as PrismaConditionGroup,
} from '@prisma/client'
import { group as makeGroup, leaf, type ConditionNode } from '../domain/condition-tree'
import { toDataType } from '../domain/data-types'
import { isLogicalOperator } from '../domain/logical'
import type {
  ConditionValueType,
  Rule,
  RuleAction,
  RuleCondition,
} from '../domain/types'

/** Fila de Prisma con sus relaciones ya incluidas. */
export type PrismaRuleWithRelations = PrismaRule & {
  conditions: PrismaCondition[]
  conditionGroups: PrismaConditionGroup[]
  actions: PrismaAction[]
  group: PrismaGroup | null
}

const VALUE_TYPES: readonly ConditionValueType[] = [
  'STRING',
  'NUMBER',
  'BOOLEAN',
  'DATE',
  'ARRAY',
  'NULL',
]

function toValueType(raw: string): ConditionValueType {
  return (VALUE_TYPES as readonly string[]).includes(raw)
    ? (raw as ConditionValueType)
    : 'STRING'
}

/**
 * Normaliza el valor esperado según su tipo declarado. La columna `valor` es
 * JSON, así que las fechas llegan como string ISO y hay que rehidratarlas para
 * que los operadores ordinales funcionen.
 */
function coerceValue(raw: unknown, valueType: ConditionValueType): unknown {
  if (raw === null || raw === undefined) return null
  switch (valueType) {
    case 'DATE': {
      const date = new Date(raw as string)
      return Number.isNaN(date.getTime()) ? raw : date
    }
    case 'NUMBER':
      return typeof raw === 'number' ? raw : Number(raw)
    case 'BOOLEAN':
      return Boolean(raw)
    default:
      return raw
  }
}

function mapCondition(row: PrismaCondition): RuleCondition {
  const valueType = toValueType(row.tipoValor)
  return {
    id: row.id,
    conditionType: row.conditionType,
    field: row.campo,
    operator: row.operador,
    value: coerceValue(row.valor, valueType),
    dataType: toDataType(row.dataType),
    valueType,
    order: row.orden,
  }
}

function mapAction(row: PrismaAction): RuleAction {
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

/**
 * Reconstruye el árbol de condiciones desde las filas planas. Devuelve `null`
 * si la regla no usa grupos (modo plano de Fase 1: el compilador arma el árbol
 * desde `conditions` + `matchType`).
 */
function buildTreeFromRows(
  groups: PrismaConditionGroup[],
  conditions: RuleCondition[],
  conditionRows: PrismaCondition[],
): ConditionNode | null {
  if (groups.length === 0) return null

  // Índice condición-de-dominio por id, y su groupId original.
  const byId = new Map(conditions.map((c) => [c.id, c]))
  const groupIdOf = new Map(conditionRows.map((r) => [r.id, r.groupId]))

  const childGroupsOf = (parentId: string | null) =>
    groups
      .filter((g) => g.parentId === parentId)
      .sort((a, b) => a.orden - b.orden)

  const conditionsOf = (groupId: string | null) =>
    conditionRows
      .filter((r) => (groupId === null ? r.groupId === null : r.groupId === groupId))
      .sort((a, b) => a.orden - b.orden)
      .map((r) => byId.get(r.id))
      .filter((c): c is RuleCondition => c !== undefined)
      .map(leaf)

  const buildGroup = (g: PrismaConditionGroup): ConditionNode => {
    const operator = isLogicalOperator(g.operator) ? g.operator : 'AND'
    const children: ConditionNode[] = [
      ...conditionsOf(g.id),
      ...childGroupsOf(g.id).map(buildGroup),
    ]
    return makeGroup(operator, children, g.id)
  }

  const roots = childGroupsOf(null)
  const looseConditions = conditionsOf(null) // conditions con groupId null
  const rootNodes = roots.map(buildGroup)

  // Un único grupo raíz y sin condiciones sueltas → ese grupo es la raíz.
  if (rootNodes.length === 1 && looseConditions.length === 0) return rootNodes[0]

  // Varios grupos raíz y/o condiciones sueltas → raíz sintética AND.
  void groupIdOf // (reservado para diagnósticos futuros)
  return makeGroup('AND', [...rootNodes, ...looseConditions], 'synthetic_root')
}

/** Traduce una fila de regla (con relaciones) al agregado de dominio. */
export function mapRule(row: PrismaRuleWithRelations): Rule {
  const conditions = row.conditions
    .map(mapCondition)
    .sort((a, b) => a.order - b.order)

  return {
    id: row.id,
    companyId: row.companyId,
    group: row.group
      ? { id: row.group.id, key: row.group.key, name: row.group.nombre }
      : null,
    name: row.nombre,
    description: row.descripcion,
    status: row.status,
    isActive: row.activo,
    priority: row.prioridad,
    version: row.version,
    matchType: row.matchType,
    validFrom: row.validoDesde,
    validUntil: row.validoHasta,
    conditions,
    conditionTree: buildTreeFromRows(row.conditionGroups, conditions, row.conditions),
    actions: row.actions.map(mapAction).sort((a, b) => a.order - b.order),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
