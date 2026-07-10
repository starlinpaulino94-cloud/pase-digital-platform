/**
 * Puertos del Framework de Promociones (Fase 4).
 *
 * El servicio depende de estas abstracciones, nunca de Prisma (Dependency
 * Inversion). La infraestructura las implementa. Así la lógica de ciclo de vida,
 * versionado y auditoría es testeable con un repositorio en memoria.
 */

import type { PromotionAuditEntry } from '../domain/audit'
import type {
  Promotion,
  PromotionActionDef,
  PromotionRestrictionDef,
  PromotionStatus,
} from '../domain/types'

/** Datos para crear una promoción (todo lo administrativo es opcional salvo lo mínimo). */
export interface CreatePromotionData {
  readonly companyId: string
  readonly name: string
  readonly description?: string | null
  readonly category?: string | null
  readonly priority?: number
  readonly startsAt?: Date | null
  readonly endsAt?: Date | null
  readonly config?: Record<string, unknown>
  readonly metadata?: Record<string, unknown>
  readonly createdById?: string | null
}

/** Campos administrativos actualizables (parche parcial). */
export interface UpdatePromotionData {
  readonly name?: string
  readonly description?: string | null
  readonly category?: string | null
  readonly priority?: number
  readonly startsAt?: Date | null
  readonly endsAt?: Date | null
  readonly config?: Record<string, unknown>
  readonly metadata?: Record<string, unknown>
  readonly updatedById?: string | null
}

export interface ListPromotionsQuery {
  readonly companyId: string
  readonly status?: PromotionStatus
  readonly category?: string
}

/** Instantánea de versión a persistir. */
export interface PromotionVersionSnapshot {
  readonly promotionId: string
  readonly version: number
  readonly snapshot: Promotion
  readonly summary: string | null
  readonly createdById: string | null
}

/**
 * Repositorio de promociones. Aísla la persistencia. Todas las operaciones son
 * multi-tenant: `companyId` acota siempre la consulta.
 */
export interface PromotionRepository {
  create(data: CreatePromotionData): Promise<Promotion>
  update(id: string, data: UpdatePromotionData): Promise<Promotion>
  findById(id: string): Promise<Promotion | null>
  list(query: ListPromotionsQuery): Promise<Promotion[]>
  setStatus(id: string, status: PromotionStatus, updatedById: string | null): Promise<Promotion>
  bumpVersion(id: string): Promise<Promotion>
  setRules(id: string, ruleIds: string[]): Promise<Promotion>
  setActions(id: string, actions: Omit<PromotionActionDef, 'id'>[]): Promise<Promotion>
  setRestrictions(id: string, restrictions: Omit<PromotionRestrictionDef, 'id'>[]): Promise<Promotion>
  saveVersion(snapshot: PromotionVersionSnapshot): Promise<void>
  recordAudit(entry: PromotionAuditEntry): Promise<void>
}
