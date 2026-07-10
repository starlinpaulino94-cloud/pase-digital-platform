/**
 * PromotionService: API interna del Framework de Promociones (Fase 4).
 *
 * Orquesta el CRUD, el ciclo de vida (con transiciones controladas), el
 * versionado (historial inmutable) y la auditoría. NO contiene lógica comercial
 * (nada de descuentos, 2x1, cashback…): solo administra la definición de la
 * promoción. Depende de puertos, nunca de Prisma.
 */

import { computeChanges, type PromotionAuditAction } from '../domain/audit'
import { validateTransition } from '../domain/lifecycle'
import type {
  Promotion,
  PromotionActionDef,
  PromotionRestrictionDef,
  PromotionStatus,
} from '../domain/types'
import type {
  CreatePromotionData,
  ListPromotionsQuery,
  PromotionRepository,
  UpdatePromotionData,
} from './ports'

/** Error de operación no encontrada (excepcional). */
export class PromotionNotFoundError extends Error {
  constructor(id: string) {
    super(`Promoción no encontrada: ${id}`)
    this.name = 'PromotionNotFoundError'
  }
}

/** Resultado de una operación que puede rechazarse por regla de negocio. */
export type PromotionResult =
  | { readonly ok: true; readonly promotion: Promotion }
  | { readonly ok: false; readonly error: string }

export interface ActorRef {
  readonly userId?: string | null
}

export class PromotionService {
  constructor(private readonly repo: PromotionRepository) {}

  // ── Consulta ──────────────────────────────────────────────────────────────

  async get(id: string): Promise<Promotion | null> {
    return this.repo.findById(id)
  }

  async list(query: ListPromotionsQuery): Promise<Promotion[]> {
    return this.repo.list(query)
  }

  // ── Creación / actualización ────────────────────────────────────────────

  async create(data: CreatePromotionData): Promise<Promotion> {
    const promotion = await this.repo.create(data)
    await this.repo.recordAudit({
      promotionId: promotion.id,
      companyId: promotion.companyId,
      userId: data.createdById ?? null,
      action: 'CREATED',
      previousStatus: null,
      newStatus: promotion.status,
      changes: {},
    })
    return promotion
  }

  async update(id: string, data: UpdatePromotionData): Promise<Promotion> {
    const before = await this.require(id)
    const updated = await this.repo.update(id, data)
    const changes = computeChanges(
      adminSnapshot(before),
      adminSnapshot(updated),
    )
    if (Object.keys(changes).length > 0) {
      await this.audit(updated, 'UPDATED', data.updatedById ?? null, {
        previousStatus: before.status,
        newStatus: updated.status,
        changes,
      })
    }
    return updated
  }

  // ── Ciclo de vida (transiciones controladas) ──────────────────────────────

  /**
   * Cambia el estado validando la transición. Devuelve un resultado: nunca
   * aplica una transición inválida.
   */
  async changeStatus(
    id: string,
    to: PromotionStatus,
    actor: ActorRef = {},
  ): Promise<PromotionResult> {
    const current = await this.require(id)
    const error = validateTransition(current.status, to)
    if (error) return { ok: false, error }

    const updated = await this.repo.setStatus(id, to, actor.userId ?? null)
    await this.audit(updated, 'STATUS_CHANGED', actor.userId ?? null, {
      previousStatus: current.status,
      newStatus: to,
      changes: { status: { from: current.status, to } },
    })
    return { ok: true, promotion: updated }
  }

  activate(id: string, actor?: ActorRef) { return this.changeStatus(id, 'ACTIVE', actor) }
  pause(id: string, actor?: ActorRef) { return this.changeStatus(id, 'PAUSED', actor) }
  suspend(id: string, actor?: ActorRef) { return this.changeStatus(id, 'SUSPENDED', actor) }
  schedule(id: string, actor?: ActorRef) { return this.changeStatus(id, 'SCHEDULED', actor) }
  end(id: string, actor?: ActorRef) { return this.changeStatus(id, 'ENDED', actor) }
  cancel(id: string, actor?: ActorRef) { return this.changeStatus(id, 'CANCELLED', actor) }
  archive(id: string, actor?: ActorRef) { return this.changeStatus(id, 'ARCHIVED', actor) }

  // ── Versionado (historial inmutable) ──────────────────────────────────────

  /**
   * Congela la versión ACTUAL como instantánea inmutable e incrementa el
   * contador de versión. El historial nunca se borra.
   */
  async createVersion(
    id: string,
    opts: { summary?: string; actor?: ActorRef } = {},
  ): Promise<Promotion> {
    const current = await this.require(id)
    await this.repo.saveVersion({
      promotionId: current.id,
      version: current.version,
      snapshot: current,
      summary: opts.summary ?? null,
      createdById: opts.actor?.userId ?? null,
    })
    const bumped = await this.repo.bumpVersion(id)
    await this.audit(bumped, 'VERSIONED', opts.actor?.userId ?? null, {
      previousStatus: current.status,
      newStatus: bumped.status,
      changes: { version: { from: current.version, to: bumped.version } },
    })
    return bumped
  }

  // ── Duplicación ───────────────────────────────────────────────────────────

  /** Clona una promoción (reglas, acciones y restricciones) en estado DRAFT. */
  async duplicate(id: string, actor: ActorRef = {}): Promise<Promotion> {
    const original = await this.require(id)
    const copy = await this.repo.create({
      companyId: original.companyId,
      name: `${original.name} (copia)`,
      description: original.description,
      category: original.category,
      priority: original.priority,
      startsAt: null,
      endsAt: null,
      config: { ...original.config },
      metadata: { ...original.metadata, duplicatedFrom: original.id },
      createdById: actor.userId ?? null,
    })
    if (original.rules.length > 0) {
      await this.repo.setRules(copy.id, original.rules.map((r) => r.ruleId))
    }
    if (original.actions.length > 0) {
      await this.repo.setActions(copy.id, original.actions.map(stripId))
    }
    if (original.restrictions.length > 0) {
      await this.repo.setRestrictions(copy.id, original.restrictions.map(stripId))
    }
    const full = await this.repo.findById(copy.id)
    const result = full ?? copy
    await this.audit(result, 'DUPLICATED', actor.userId ?? null, {
      previousStatus: null,
      newStatus: result.status,
      changes: { duplicatedFrom: { from: null, to: original.id } },
    })
    return result
  }

  // ── Mapeos a los motores (sin lógica comercial) ───────────────────────────

  async setRules(id: string, ruleIds: string[], actor: ActorRef = {}): Promise<Promotion> {
    const updated = await this.repo.setRules(id, ruleIds)
    await this.audit(updated, 'RULES_CHANGED', actor.userId ?? null, {
      previousStatus: updated.status,
      newStatus: updated.status,
      changes: { rules: { from: null, to: ruleIds } },
    })
    return updated
  }

  async setActions(
    id: string,
    actions: Omit<PromotionActionDef, 'id'>[],
    actor: ActorRef = {},
  ): Promise<Promotion> {
    const updated = await this.repo.setActions(id, actions)
    await this.audit(updated, 'ACTIONS_CHANGED', actor.userId ?? null, {
      previousStatus: updated.status,
      newStatus: updated.status,
      changes: { actions: { from: null, to: actions.map((a) => a.type) } },
    })
    return updated
  }

  async setRestrictions(
    id: string,
    restrictions: Omit<PromotionRestrictionDef, 'id'>[],
    actor: ActorRef = {},
  ): Promise<Promotion> {
    const updated = await this.repo.setRestrictions(id, restrictions)
    await this.audit(updated, 'RESTRICTIONS_CHANGED', actor.userId ?? null, {
      previousStatus: updated.status,
      newStatus: updated.status,
      changes: { restrictions: { from: null, to: restrictions.map((r) => r.type) } },
    })
    return updated
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  private async require(id: string): Promise<Promotion> {
    const promotion = await this.repo.findById(id)
    if (!promotion) throw new PromotionNotFoundError(id)
    return promotion
  }

  private async audit(
    promotion: Promotion,
    action: PromotionAuditAction,
    userId: string | null,
    parts: {
      previousStatus: PromotionStatus | null
      newStatus: PromotionStatus | null
      changes: Record<string, { from: unknown; to: unknown }>
    },
  ): Promise<void> {
    await this.repo.recordAudit({
      promotionId: promotion.id,
      companyId: promotion.companyId,
      userId,
      action,
      previousStatus: parts.previousStatus,
      newStatus: parts.newStatus,
      changes: parts.changes,
    })
  }
}

/** Vista administrativa (para el diff de auditoría). */
function adminSnapshot(p: Promotion): Record<string, unknown> {
  return {
    name: p.name,
    description: p.description,
    category: p.category,
    priority: p.priority,
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    config: p.config,
    metadata: p.metadata,
  }
}

function stripId<T extends { id: string }>(obj: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = obj
  return rest
}
