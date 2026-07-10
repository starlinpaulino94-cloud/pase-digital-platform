/**
 * UsageTracker (Fase A): registra el uso de una membresía y hace cumplir los
 * límites (Usage Tracking + Membership Rules). Delega los límites deterministas
 * en `evaluateUsage` y, si el plan define reglas BEL, las evalúa con el motor de
 * expresiones (reutilización, sin duplicar lógica).
 */

import type { ExpressionService } from '@/lib/bel'
import { RuleContextBuilder, type RuleContext } from '@/lib/rule-engine'
import { evaluateUsage, type UsageDecision } from '../domain/limits'
import type { MembershipInstance, MembershipPlan, MembershipUsageRecord } from '../domain/types'
import type { MembershipRepository } from './ports'

export interface UsageTrackerDeps {
  readonly repo: MembershipRepository
  /** Motor BEL para reglas de uso personalizadas (opcional). */
  readonly expressions?: ExpressionService
}

export interface RegisterUsageInput {
  readonly plan: MembershipPlan
  readonly instance: MembershipInstance
  readonly service: string
  readonly quantity?: number
  readonly vehicle?: string | null
  readonly at?: Date
  /** Contexto para evaluar reglas BEL (cliente, vehículo, etc.). */
  readonly context?: RuleContext
  readonly meta?: Record<string, unknown>
}

export interface RegisterUsageResult {
  readonly decision: UsageDecision
  readonly record?: MembershipUsageRecord
  readonly creditsRemaining?: number | null
}

export class UsageTracker {
  constructor(private readonly deps: UsageTrackerDeps) {}

  /**
   * Comprueba si el uso está permitido; si lo está, lo registra y descuenta
   * créditos (en planes no ilimitados). Nunca lanza por reglas de negocio.
   */
  async register(input: RegisterUsageInput): Promise<RegisterUsageResult> {
    const at = input.at ?? new Date()
    // Historial reciente: último mes cubre día/semana/mes e intervalo mínimo.
    const since = new Date(at.getTime() - 31 * 86_400_000)
    const recentUsage = await this.deps.repo.recentUsage(input.instance.id, since)

    // 1. Límites deterministas.
    let decision = evaluateUsage({ plan: input.plan, instance: input.instance, service: input.service, at, recentUsage })
    if (!decision.allowed) return { decision }

    // 2. Reglas BEL personalizadas (si las hay y hay motor).
    const customRules = input.plan.config.limits?.customRules ?? []
    if (customRules.length > 0 && this.deps.expressions) {
      const ctx = input.context ?? new RuleContextBuilder(input.instance.companyId).at(at).build()
      for (const expr of customRules) {
        const r = this.deps.expressions.evaluate(expr, ctx, { now: at })
        if (!r.ok || r.value !== true) {
          decision = { allowed: false, code: 'INACTIVE', reason: `Regla de uso no cumplida: ${expr}` }
          return { decision }
        }
      }
    }

    // 3. Registrar y descontar créditos.
    const quantity = input.quantity ?? 1
    const record = await this.deps.repo.recordUsage({
      companyId: input.instance.companyId,
      instanceId: input.instance.id,
      service: input.service,
      quantity,
      vehicle: input.vehicle ?? null,
      usedAt: at,
      meta: input.meta ?? {},
    })

    let creditsRemaining = input.instance.creditsRemaining
    if (!input.plan.unlimited && creditsRemaining !== null) {
      creditsRemaining = Math.max(0, creditsRemaining - quantity)
      await this.deps.repo.updateInstance(input.instance.id, { creditsRemaining })
    }

    return { decision, record, creditsRemaining }
  }
}
