/**
 * MembershipService: API interna del Membership Engine (Fase A).
 *
 * Administra planes (CRUD) y membresías de suscriptores (subscribe, renovar,
 * cancelar, pausar, upgrade/downgrade) con ciclo de vida controlado. Soporta los
 * 20 modelos por configuración; no contiene lógica de una industria concreta.
 */

import { validateTransition } from '../domain/lifecycle'
import type {
  MembershipInstance,
  MembershipInstanceStatus,
  MembershipPeriodicity,
  MembershipPlan,
} from '../domain/types'
import type {
  CreatePlanData,
  MembershipRepository,
  SubscribeData,
  UpdatePlanData,
} from './ports'

export class MembershipError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MembershipError'
  }
}

export type MembershipResult =
  | { readonly ok: true; readonly instance: MembershipInstance }
  | { readonly ok: false; readonly error: string }

/** Días aproximados por periodicidad (para calcular el fin del período). */
const PERIOD_DAYS: Record<MembershipPeriodicity, number | null> = {
  NONE: null,
  ONE_TIME: null,
  WEEKLY: 7,
  MONTHLY: 30,
  QUARTERLY: 90,
  SEMIANNUAL: 182,
  ANNUAL: 365,
  SEASONAL: 90,
}

export class MembershipService {
  constructor(private readonly repo: MembershipRepository) {}

  // ── Planes ────────────────────────────────────────────────────────────────

  createPlan(data: CreatePlanData): Promise<MembershipPlan> {
    return this.repo.createPlan(data)
  }
  updatePlan(id: string, data: UpdatePlanData): Promise<MembershipPlan> {
    return this.repo.updatePlan(id, data)
  }
  getPlan(id: string): Promise<MembershipPlan | null> {
    return this.repo.findPlan(id)
  }
  listPlans(companyId: string): Promise<MembershipPlan[]> {
    return this.repo.listPlans(companyId)
  }
  publishPlan(id: string): Promise<MembershipPlan> {
    return this.repo.updatePlan(id, { status: 'PUBLISHED' })
  }

  // ── Suscripción ───────────────────────────────────────────────────────────

  /** Da de alta una membresía para un suscriptor, calculando fechas y créditos. */
  async subscribe(data: SubscribeData): Promise<MembershipInstance> {
    const plan = await this.repo.findPlan(data.planId)
    if (!plan) throw new MembershipError(`Plan no encontrado: ${data.planId}`)
    if (plan.companyId !== data.companyId) throw new MembershipError('El plan pertenece a otra empresa.')

    const startsAt = data.startsAt ?? new Date()
    const endsAt = this.computeEnd(plan, startsAt)
    return this.repo.createInstance({
      companyId: data.companyId,
      planId: plan.id,
      subscriberId: data.subscriberId,
      subscriberKind: data.subscriberKind ?? 'CLIENT',
      status: 'ACTIVE',
      startsAt,
      endsAt,
      renewsAt: endsAt,
      autoRenew: data.autoRenew ?? plan.config.renewal?.auto ?? false,
      creditsRemaining: plan.unlimited ? null : plan.credits ?? null,
      vehicles: data.vehicles ?? [],
      config: data.config ?? {},
    })
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  async changeStatus(id: string, to: MembershipInstanceStatus): Promise<MembershipResult> {
    const instance = await this.require(id)
    const error = validateTransition(instance.status, to)
    if (error) return { ok: false, error }
    const updated = await this.repo.updateInstance(id, { status: to })
    return { ok: true, instance: updated }
  }

  pause(id: string) { return this.changeStatus(id, 'PAUSED') }
  resume(id: string) { return this.changeStatus(id, 'ACTIVE') }
  suspend(id: string) { return this.changeStatus(id, 'SUSPENDED') }
  cancel(id: string) { return this.changeStatus(id, 'CANCELLED') }

  /** Renueva: extiende el período y repone créditos (respetando la acumulación). */
  async renew(id: string): Promise<MembershipInstance> {
    const instance = await this.require(id)
    const plan = await this.requirePlan(instance.planId)
    const base = instance.endsAt && instance.endsAt > new Date() ? instance.endsAt : new Date()
    const endsAt = this.computeEnd(plan, base)

    let credits = plan.unlimited ? null : plan.credits ?? null
    if (credits !== null && instance.creditsRemaining) {
      const rollover = plan.config.limits?.maxCreditsRollover ?? 0
      credits += Math.min(instance.creditsRemaining, rollover)
    }
    return this.repo.updateInstance(id, {
      status: 'ACTIVE',
      startsAt: instance.startsAt ?? new Date(),
      endsAt,
      renewsAt: endsAt,
      creditsRemaining: credits,
    })
  }

  // ── Upgrade / Downgrade ───────────────────────────────────────────────────

  /** Cambia el plan de la membresía (upgrade/downgrade). Repone créditos al nuevo plan. */
  async changePlan(id: string, newPlanId: string): Promise<MembershipInstance> {
    const instance = await this.require(id)
    const newPlan = await this.requirePlan(newPlanId)
    if (newPlan.companyId !== instance.companyId) throw new MembershipError('El plan destino es de otra empresa.')
    return this.repo.updateInstance(id, {
      planId: newPlan.id,
      creditsRemaining: newPlan.unlimited ? null : newPlan.credits ?? null,
    })
  }

  /**
   * Señal de upgrade/downgrade (arquitectura del Upgrade/Downgrade Engine):
   * sugiere cambiar de plan según el uso frente a la capacidad del plan actual.
   */
  suggestPlanChange(plan: MembershipPlan, usageInPeriod: number): 'UPGRADE' | 'DOWNGRADE' | 'KEEP' {
    const cap = plan.config.limits?.maxPerPeriod?.count ?? plan.credits ?? null
    if (cap === null || plan.unlimited) {
      // En ilimitado: uso muy bajo podría sugerir downgrade.
      return usageInPeriod <= 1 ? 'DOWNGRADE' : 'KEEP'
    }
    if (usageInPeriod >= cap) return 'UPGRADE'
    if (usageInPeriod <= Math.floor(cap / 3)) return 'DOWNGRADE'
    return 'KEEP'
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  private computeEnd(plan: MembershipPlan, from: Date): Date | null {
    const days = plan.durationDays ?? PERIOD_DAYS[plan.periodicity]
    if (days === null || days === undefined) return null
    const d = new Date(from)
    d.setDate(d.getDate() + days)
    return d
  }

  private async require(id: string): Promise<MembershipInstance> {
    const instance = await this.repo.findInstance(id)
    if (!instance) throw new MembershipError(`Membresía no encontrada: ${id}`)
    return instance
  }

  private async requirePlan(id: string): Promise<MembershipPlan> {
    const plan = await this.repo.findPlan(id)
    if (!plan) throw new MembershipError(`Plan no encontrado: ${id}`)
    return plan
  }
}
