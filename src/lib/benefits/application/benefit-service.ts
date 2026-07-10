/**
 * BenefitService: API interna del Benefit Engine (Fase C).
 *
 * Administra el catálogo de beneficios (CRUD, publicar/archivar) y su ciclo de
 * entrega/canje (grant → redeem → revoke) con las restricciones del motor
 * (segmento, servicio, disponibilidad, stock, frecuencia). No contiene lógica
 * de una industria concreta: la especificidad vive en las plantillas.
 */

import {
  checkEligibility,
  grantExpiry,
  type EligibilityContext,
  type EligibilityResult,
} from '../domain/eligibility'
import type { Benefit, BenefitGrant } from '../domain/types'
import type {
  BenefitRepository,
  CreateBenefitData,
  GrantBenefitData,
  UpdateBenefitData,
} from './ports'

export class BenefitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BenefitError'
  }
}

export type GrantResult =
  | { readonly ok: true; readonly grant: BenefitGrant }
  | { readonly ok: false; readonly error: string; readonly eligibility?: EligibilityResult }

export class BenefitService {
  constructor(private readonly repo: BenefitRepository) {}

  // ── Catálogo ────────────────────────────────────────────────────────────────

  createBenefit(data: CreateBenefitData): Promise<Benefit> {
    return this.repo.createBenefit(data)
  }
  updateBenefit(id: string, data: UpdateBenefitData): Promise<Benefit> {
    return this.repo.updateBenefit(id, data)
  }
  getBenefit(id: string): Promise<Benefit | null> {
    return this.repo.findBenefit(id)
  }
  listBenefits(
    companyId: string,
    filter?: Parameters<BenefitRepository['listBenefits']>[1],
  ): Promise<Benefit[]> {
    return this.repo.listBenefits(companyId, filter)
  }
  publishBenefit(id: string): Promise<Benefit> {
    return this.repo.updateBenefit(id, { status: 'PUBLISHED' })
  }
  archiveBenefit(id: string): Promise<Benefit> {
    return this.repo.updateBenefit(id, { status: 'ARCHIVED' })
  }

  // ── Entrega y canje ──────────────────────────────────────────────────────────

  /**
   * Entrega un beneficio a un suscriptor desde un módulo. Verifica elegibilidad
   * (restricciones del motor + stock + frecuencia) antes de crear el grant.
   * `ctx` aporta segmento/servicio/tier; las reglas BEL quedan como pendientes.
   */
  async grant(data: GrantBenefitData, ctx: EligibilityContext = {}): Promise<GrantResult> {
    const benefit = await this.repo.findBenefit(data.benefitId)
    if (!benefit) return { ok: false, error: 'Beneficio no encontrado.' }
    if (benefit.companyId !== data.companyId) {
      return { ok: false, error: 'El beneficio pertenece a otra empresa.' }
    }

    // Contexto de disponibilidad/frecuencia calculado desde el repositorio.
    const [stockConsumed, redemptionsInWindow] = await Promise.all([
      benefit.config.availability?.stock != null
        ? this.repo.countRedeemed(benefit.id)
        : Promise.resolve(0),
      benefit.config.restrictions?.maxRedemptions != null
        ? this.repo.countGrants(benefit.id, data.subscriberId, 'REDEEMED', windowStart(benefit))
        : Promise.resolve(0),
    ])

    const eligibility = checkEligibility(benefit, {
      ...ctx,
      stockConsumed,
      redemptionsInWindow,
    })
    if (!eligibility.eligible) {
      return { ok: false, error: 'El suscriptor no es elegible para este beneficio.', eligibility }
    }

    const now = new Date()
    const grant = await this.repo.createGrant({
      companyId: data.companyId,
      benefitId: data.benefitId,
      subscriberId: data.subscriberId,
      subscriberKind: data.subscriberKind ?? 'CLIENT',
      sourceModule: data.sourceModule,
      status: 'GRANTED',
      grantedAt: now,
      expiresAt: data.expiresAt ?? grantExpiry(benefit, now),
      meta: data.meta ?? {},
    })
    return { ok: true, grant }
  }

  /** Marca un grant como canjeado. Idempotente-friendly: rechaza estados no vigentes. */
  async redeem(grantId: string): Promise<GrantResult> {
    const grant = await this.repo.findGrant(grantId)
    if (!grant) return { ok: false, error: 'Beneficio entregado no encontrado.' }
    if (grant.status !== 'GRANTED') {
      return { ok: false, error: `El beneficio no se puede canjear (estado: ${grant.status}).` }
    }
    if (grant.expiresAt && grant.expiresAt < new Date()) {
      await this.repo.updateGrantStatus(grantId, 'EXPIRED', null)
      return { ok: false, error: 'El beneficio expiró.' }
    }
    const updated = await this.repo.updateGrantStatus(grantId, 'REDEEMED', new Date())
    return { ok: true, grant: updated }
  }

  /** Revoca un grant no canjeado (la empresa lo retira). */
  async revoke(grantId: string): Promise<GrantResult> {
    const grant = await this.repo.findGrant(grantId)
    if (!grant) return { ok: false, error: 'Beneficio entregado no encontrado.' }
    if (grant.status === 'REDEEMED') {
      return { ok: false, error: 'No se puede revocar un beneficio ya canjeado.' }
    }
    const updated = await this.repo.updateGrantStatus(grantId, 'REVOKED', null)
    return { ok: true, grant: updated }
  }
}

/** Inicio de la ventana del límite de canjes según `perPeriod`. */
function windowStart(benefit: Benefit): Date | undefined {
  const period = benefit.config.restrictions?.perPeriod
  if (!period || period === 'EVER') return undefined
  const now = new Date()
  const d = new Date(now)
  switch (period) {
    case 'DAY':
      d.setDate(d.getDate() - 1)
      break
    case 'WEEK':
      d.setDate(d.getDate() - 7)
      break
    case 'MONTH':
      d.setMonth(d.getMonth() - 1)
      break
    case 'YEAR':
      d.setFullYear(d.getFullYear() - 1)
      break
  }
  return d
}
