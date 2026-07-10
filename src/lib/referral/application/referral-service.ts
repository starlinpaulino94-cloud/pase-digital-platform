/**
 * ReferralService: API interna del Referral Engine (Fase D).
 *
 * Administra programas (CRUD, publicar), inscribe participantes (quien invita),
 * registra referidos con antifraude, los hace avanzar por el flujo configurable
 * evaluando condiciones/límites, y libera recompensas reutilizando el Benefit
 * Engine (Fase C). Soporta los 10 modelos por configuración; sin lógica de una
 * industria concreta.
 */

import {
  evaluateConditions,
  type ReferralFacts,
} from '../domain/conditions'
import { applyEscalation, currentTier } from '../domain/escalation'
import { evaluateFraud, type FraudSignals } from '../domain/fraud'
import { checkLimits, type LimitContext } from '../domain/limits'
import { rewardGrantPlans, type RewardGrantPlan } from '../domain/rewards'
import { canAdvance, reachesReward } from '../domain/states'
import type {
  ReferralParticipant,
  ReferralProgram,
  ReferralReferral,
  ReferralReward,
} from '../domain/types'
import type {
  CreateProgramData,
  EnrollData,
  ReferralRepository,
  UpdateProgramData,
} from './ports'

export class ReferralError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReferralError'
  }
}

/** Puerto para conceder una recompensa (implementado sobre el Benefit Engine). */
export interface RewardGranter {
  grant(input: {
    companyId: string
    programId: string
    referralId: string
    subscriberId: string
    subscriberKind: string
    plan: RewardGrantPlan
  }): Promise<{ grantId: string | null }>
}

export interface ReferralServiceDeps {
  readonly repo: ReferralRepository
  /** Concede beneficios; si falta, la recompensa se marca liberada sin grant. */
  readonly granter?: RewardGranter
}

export interface RegisterReferralInput {
  readonly programId: string
  readonly participantId: string
  readonly referredId?: string | null
  readonly referredKind?: string
  readonly signals?: FraudSignals
  readonly meta?: Record<string, unknown>
}

export interface AdvanceInput {
  readonly referralId: string
  readonly to: string
  readonly facts?: ReferralFacts
  readonly limitContext?: LimitContext
}

export type ReferralResult =
  | { readonly ok: true; readonly referral: ReferralReferral }
  | { readonly ok: false; readonly error: string; readonly code?: string }

export class ReferralService {
  private readonly repo: ReferralRepository
  private readonly granter?: RewardGranter

  constructor(deps: ReferralServiceDeps) {
    this.repo = deps.repo
    this.granter = deps.granter
  }

  // ── Programas ─────────────────────────────────────────────────────────────

  createProgram(data: CreateProgramData): Promise<ReferralProgram> {
    return this.repo.createProgram(data)
  }
  updateProgram(id: string, data: UpdateProgramData): Promise<ReferralProgram> {
    return this.repo.updateProgram(id, data)
  }
  getProgram(id: string): Promise<ReferralProgram | null> {
    return this.repo.findProgram(id)
  }
  listPrograms(
    companyId: string,
    filter?: Parameters<ReferralRepository['listPrograms']>[1],
  ): Promise<ReferralProgram[]> {
    return this.repo.listPrograms(companyId, filter)
  }
  publishProgram(id: string): Promise<ReferralProgram> {
    return this.repo.updateProgram(id, { status: 'PUBLISHED' })
  }
  archiveProgram(id: string): Promise<ReferralProgram> {
    return this.repo.updateProgram(id, { status: 'ARCHIVED' })
  }

  // ── Participantes ─────────────────────────────────────────────────────────

  /** Inscribe a quien invita, con su código único dentro del programa. */
  async enroll(data: EnrollData): Promise<ReferralParticipant> {
    const program = await this.repo.findProgram(data.programId)
    if (!program) throw new ReferralError('Programa no encontrado.')
    if (program.companyId !== data.companyId) {
      throw new ReferralError('El programa pertenece a otra empresa.')
    }
    const existing = await this.repo.findParticipantByCode(data.programId, data.code)
    if (existing) throw new ReferralError('El código ya está en uso en este programa.')
    return this.repo.createParticipant(data)
  }

  // ── Referidos ─────────────────────────────────────────────────────────────

  /**
   * Registra un referido. Evalúa antifraude (reglas activas del programa) y crea
   * el referido en el estado REGISTERED; los sospechosos se guardan marcados y
   * no liberarán recompensa.
   */
  async registerReferral(input: RegisterReferralInput): Promise<ReferralResult> {
    const [program, participant] = await Promise.all([
      this.repo.findProgram(input.programId),
      this.repo.findParticipant(input.participantId),
    ])
    if (!program) return { ok: false, error: 'Programa no encontrado.' }
    if (!participant || participant.programId !== program.id) {
      return { ok: false, error: 'Participante no encontrado en el programa.' }
    }
    if (participant.status !== 'ACTIVE') {
      return { ok: false, error: 'El participante no está activo.', code: 'PARTICIPANT_BLOCKED' }
    }

    // Límite de registros por ventana (por participante).
    const now = new Date()
    const limits = program.config.limits
    if (limits) {
      const [today, week, month] = await Promise.all([
        this.repo.countReferrals(participant.id, startOf('DAY', now)),
        this.repo.countReferrals(participant.id, startOf('WEEK', now)),
        this.repo.countReferrals(participant.id, startOf('MONTH', now)),
      ])
      const lim = checkLimits(limits, { now, todayCount: today, weekCount: week, monthCount: month })
      if (!lim.allowed) {
        return { ok: false, error: 'Se alcanzó un límite del programa.', code: lim.denials[0] }
      }
    }

    const fraud = evaluateFraud(program.config.fraud, input.signals ?? {})

    const referral = await this.repo.createReferral({
      companyId: program.companyId,
      programId: program.id,
      participantId: participant.id,
      referredId: input.referredId ?? null,
      referredKind: input.referredKind ?? 'CLIENT',
      state: 'REGISTERED',
      suspicious: fraud.suspicious,
      fraudReasons: fraud.reasons,
      meta: input.meta,
    })

    await this.repo.updateParticipant(participant.id, {
      referralsCount: participant.referralsCount + 1,
    })

    return { ok: true, referral }
  }

  /**
   * Avanza un referido al siguiente estado del flujo. Si el destino alcanza el
   * estado de recompensa, evalúa condiciones, límites y fraude, y libera la
   * recompensa (Benefit Engine) aplicando el escalado progresivo.
   */
  async advance(input: AdvanceInput): Promise<ReferralResult> {
    const referral = await this.repo.findReferral(input.referralId)
    if (!referral) return { ok: false, error: 'Referido no encontrado.' }
    if (referral.rewardReleased) {
      return { ok: false, error: 'El referido ya tiene su recompensa liberada.', code: 'ALREADY_REWARDED' }
    }

    const program = await this.repo.findProgram(referral.programId)
    if (!program) return { ok: false, error: 'Programa no encontrado.' }

    if (!canAdvance(program.config, referral.state, input.to)) {
      return { ok: false, error: `No se puede avanzar de ${referral.state} a ${input.to}.`, code: 'INVALID_TRANSITION' }
    }

    const history = [
      ...referral.history.map((h) => ({ state: h.state, at: h.at })),
      { state: input.to, at: new Date().toISOString() },
    ]

    // ¿Este avance dispara la recompensa?
    const triggersReward = reachesReward(program.config, input.to) && !referral.suspicious
    if (!triggersReward) {
      const updated = await this.repo.updateReferral(referral.id, { state: input.to, history })
      return { ok: true, referral: updated }
    }

    // Condiciones de valor (compras, monto, membresía…). Si no se cumplen, NO
    // se avanza el estado: el referido queda donde estaba y puede reintentarse
    // cuando el invitado cumpla (ej. cuando confirme su compra).
    const cond = evaluateConditions(program.config.conditions, input.facts ?? {})
    if (!cond.met) {
      return { ok: false, error: `Faltan condiciones: ${cond.failed.join(', ')}.`, code: 'CONDITIONS_NOT_MET' }
    }

    // Límite global de recompensas del programa.
    const limits = program.config.limits
    if (limits?.maxRewards != null) {
      const released = await this.repo.countRewardsReleased(program.id)
      const lim = checkLimits(limits, { rewardsReleased: released })
      if (!lim.allowed) {
        return { ok: false, error: 'Se alcanzó el máximo de recompensas del programa.', code: 'MAX_REWARDS' }
      }
    }

    return this.releaseReward(program, referral, input.to, history)
  }

  /** Libera la(s) recompensa(s) del programa para un referido que califica. */
  private async releaseReward(
    program: ReferralProgram,
    referral: ReferralReferral,
    toState: string,
    history: { state: string; at: string }[],
  ): Promise<ReferralResult> {
    const participant = await this.repo.findParticipant(referral.participantId)
    if (!participant) return { ok: false, error: 'Participante no encontrado.' }

    // Escalado progresivo: al convertir, sube el conteo y desbloquea peldaños.
    const newConverted = participant.convertedCount + 1
    const tiers = program.config.tiers ?? []
    const escalation = applyEscalation(tiers, participant.convertedCount, newConverted)

    // Recompensas a entregar: base del programa + peldaños recién desbloqueados.
    const rewards: ReferralReward[] = [
      ...(program.config.rewards ?? []),
      ...escalation.unlocked.map((t) => t.reward),
    ]
    // Si es progresivo sin recompensas base, usa el peldaño vigente.
    if (rewards.length === 0 && tiers.length > 0) {
      const tier = currentTier(tiers, newConverted)
      if (tier) rewards.push(tier.reward)
    }

    let rewardGrantId: string | null = null
    if (this.granter && referral.referredId) {
      for (const reward of rewards) {
        for (const plan of rewardGrantPlans(reward)) {
          const subscriberId = plan.to === 'REFERRER' ? participant.referrerId : referral.referredId
          if (!subscriberId) continue
          const res = await this.granter.grant({
            companyId: program.companyId,
            programId: program.id,
            referralId: referral.id,
            subscriberId,
            subscriberKind: plan.to === 'REFERRER' ? participant.referrerKind : referral.referredKind,
            plan,
          })
          rewardGrantId = rewardGrantId ?? res.grantId
        }
      }
    }

    const updated = await this.repo.updateReferral(referral.id, {
      state: toState,
      history,
      rewardReleased: true,
      rewardGrantId,
    })
    await this.repo.updateParticipant(participant.id, {
      convertedCount: newConverted,
      level: escalation.level,
    })

    return { ok: true, referral: updated }
  }
}

/** Inicio del período para contar referidos (día/semana/mes). */
function startOf(period: 'DAY' | 'WEEK' | 'MONTH', now: Date): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (period === 'WEEK') d.setDate(d.getDate() - 6)
  if (period === 'MONTH') d.setDate(1)
  return d
}
