/**
 * Tipos de dominio del Motor Universal de Reglas.
 *
 * Estos tipos son la representación PURA de una regla y sus partes, sin ninguna
 * dependencia de Prisma, Next.js ni del negocio. La capa de infraestructura
 * (mappers) traduce las filas de la BD a estos tipos y viceversa, de modo que
 * el núcleo nunca conoce el detalle de persistencia (Clean Architecture).
 */

import type { DataType } from './data-types'
import type { ConditionNode } from './condition-tree'

/** Ciclo de vida de una regla. Espeja el enum `RuleStatus` de Prisma. */
export type RuleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

/** Combinación lógica de las condiciones. Espeja `RuleMatchType` de Prisma. */
export type RuleMatchType = 'ALL' | 'ANY'

/**
 * Tipo declarado del valor esperado de una condición. Sirve para coerción al
 * comparar (ej. tratar "2024-01-01" como Date). Se mantiene como unión de
 * strings —no enum de Prisma— para poder añadir tipos sin migrar la BD.
 */
export type ConditionValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ARRAY' | 'NULL'

/**
 * Condición atómica. `field` es un dot-path dentro del RuleContext y `operator`
 * la clave de un operador del registro extensible. El motor NO interpreta el
 * significado de negocio de `field`: solo resuelve la ruta y compara.
 */
export interface RuleCondition {
  readonly id: string
  /**
   * Tipo de condición: clave del ConditionTypeRegistry que sabe RESOLVER el
   * valor real desde el contexto (Fase 2). Por defecto "field" (dot-path).
   */
  readonly conditionType: string
  /** Ruta dentro del contexto, ej. "cliente.puntos" o "$now". */
  readonly field: string
  /** Id del operador en el OperatorRegistry, ej. "gte". */
  readonly operator: string
  /** Valor esperado ya deserializado desde JSON. */
  readonly value: unknown
  /** Tipo de dato que evalúa la condición: base de la validación de tipos. */
  readonly dataType: DataType
  /** Guía de coerción del valor JSON (legacy Fase 1). */
  readonly valueType: ConditionValueType
  readonly order: number
}

/**
 * Acción declarada de una regla. `type` es la clave de un handler del
 * ActionRegistry (aún sin implementar en Fase 3). Toda su configuración vive
 * como DATOS (params + banderas), nunca en código.
 */
export interface RuleAction {
  readonly id: string
  readonly type: string
  readonly params: Readonly<Record<string, unknown>>
  /** Orden/prioridad de ejecución: menor se ejecuta antes. */
  readonly order: number
  /** Si es obligatoria, su fallo marca la ejecución de la regla como fallida. */
  readonly required: boolean
  /** Reintentos ante error (0 = un solo intento). */
  readonly maxRetries: number
  /** Interruptor: si está desactivada, se omite (SKIPPED). */
  readonly enabled: boolean
  /** Versión de la configuración de la acción. */
  readonly version: number
}

/** Agrupación funcional de reglas (ej. "Validación QR"). Puramente organizativa. */
export interface RuleGroupRef {
  readonly id: string
  readonly key: string
  readonly name: string
}

/**
 * Regla completa lista para evaluar. Es un agregado (DDD): incluye sus
 * condiciones y acciones ya ordenadas.
 */
export interface Rule {
  readonly id: string
  readonly companyId: string
  readonly group: RuleGroupRef | null
  readonly name: string
  readonly description: string | null
  readonly status: RuleStatus
  readonly isActive: boolean
  readonly priority: number
  readonly version: number
  readonly matchType: RuleMatchType
  readonly validFrom: Date | null
  readonly validUntil: Date | null
  /** Condiciones planas (Fase 1). Se combinan con `matchType` si no hay árbol. */
  readonly conditions: readonly RuleCondition[]
  /**
   * Árbol booleano de condiciones (Fase 2). Si es `null`, el evaluador compila
   * uno a partir de `conditions` + `matchType` (compatibilidad hacia atrás).
   */
  readonly conditionTree: ConditionNode | null
  readonly actions: readonly RuleAction[]
  readonly createdAt: Date
  readonly updatedAt: Date
}

/**
 * ¿Es la regla evaluable AHORA? Combina interruptor, ciclo de vida y ventana de
 * vigencia. Función pura reutilizada por el repositorio y el motor para no
 * duplicar la definición de "regla activa".
 */
export function isRuleEvaluable(rule: Rule, at: Date): boolean {
  if (!rule.isActive) return false
  if (rule.status !== 'PUBLISHED') return false
  if (rule.validFrom && at < rule.validFrom) return false
  if (rule.validUntil && at > rule.validUntil) return false
  return true
}
