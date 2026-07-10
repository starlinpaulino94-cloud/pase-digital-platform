/**
 * Puertos (interfaces) que el motor NECESITA pero no implementa.
 *
 * Se definen en la capa de aplicación y se implementan en infraestructura
 * (Dependency Inversion): el motor depende de estas abstracciones, nunca de
 * Prisma. Así se puede sustituir la persistencia (Prisma, memoria, tests) sin
 * tocar el núcleo.
 */

import type { RuleContext } from '../domain/context'
import type { Rule, RuleStatus } from '../domain/types'

/** Criterios para cargar las reglas evaluables de una empresa. */
export interface FindApplicableRulesQuery {
  readonly companyId: string
  /** Si se indica, restringe a las reglas de ese grupo (por su `key`). */
  readonly groupKey?: string
  /** Momento de referencia para la ventana de vigencia. */
  readonly at: Date
}

/**
 * Repositorio de reglas. Abstrae la carga y el ciclo de vida (activar,
 * desactivar, versionar) sin exponer detalles de la BD.
 */
export interface RuleRepository {
  /** Reglas PUBLICADAS, activas y vigentes de una empresa, listas para evaluar. */
  findApplicable(query: FindApplicableRulesQuery): Promise<Rule[]>
  /** Una regla por id, con sus condiciones y acciones (o null). */
  findById(id: string): Promise<Rule | null>
  /** Todas las reglas de una empresa (para paneles de administración). */
  listByCompany(companyId: string): Promise<Rule[]>
  /** Enciende/apaga una regla sin borrarla. */
  setActive(id: string, isActive: boolean): Promise<void>
  /** Cambia el ciclo de vida (DRAFT → PUBLISHED → ARCHIVED). */
  setStatus(id: string, status: RuleStatus): Promise<void>
}

/** Entrada de auditoría de una evaluación individual. */
export interface RuleExecutionLogEntry {
  readonly ruleId: string | null
  readonly companyId: string
  readonly matched: boolean
  readonly result: Record<string, unknown>
  readonly context: Record<string, unknown>
  readonly durationMs: number
  readonly error?: string | null
}

/**
 * Sumidero de auditoría. Permite registrar (o descartar) cada evaluación. El
 * motor lo usa siempre; la implementación decide si persiste o no.
 */
export interface ExecutionLogSink {
  record(entry: RuleExecutionLogEntry): Promise<void>
}

/** Implementación por defecto: descarta los registros (no persiste nada). */
export class NoopExecutionLogSink implements ExecutionLogSink {
  async record(): Promise<void> {
    // Fase 1: por defecto no se persiste auditoría. Inyectar un sink Prisma
    // para activarla sin cambiar el motor.
  }
}

/**
 * Caché de reglas por empresa/grupo (arquitectura de rendimiento, Fase 2).
 *
 * Prepara el sistema para soportar miles de reglas sin golpear la BD en cada
 * evaluación: el motor puede consultar la caché antes que el repositorio. El
 * puerto existe ya; la implementación real (LRU, Redis, invalidación por
 * `updatedAt`) llegará cuando el volumen lo exija, SIN tocar el motor.
 */
export interface RuleCache {
  get(key: string): Promise<Rule[] | null>
  set(key: string, rules: Rule[]): Promise<void>
  invalidate(key: string): Promise<void>
}

/** Implementación por defecto: no cachea (siempre falla el get). */
export class NoopRuleCache implements RuleCache {
  async get(): Promise<Rule[] | null> {
    return null
  }
  async set(): Promise<void> {}
  async invalidate(): Promise<void> {}
}

/** Clave de caché canónica para una consulta de reglas aplicables. */
export function ruleCacheKey(companyId: string, groupKey?: string): string {
  return `rules:${companyId}:${groupKey ?? '*'}`
}

/** Snapshot mínimo y seguro del contexto para auditar sin volcar datos crudos. */
export function snapshotContext(context: RuleContext): Record<string, unknown> {
  return {
    companyId: context.companyId,
    timestamp: context.timestamp.toISOString(),
    channel: context.channel ?? null,
    namespaces: Object.keys(context.data),
  }
}
