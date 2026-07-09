/**
 * Servicio de plantillas de promoción (Fase B).
 *
 * - `createPromotionFromTemplate`: instancia una plantilla como una promoción
 *   real usando el Promotion Framework (F4): crea el plan y le adjunta acciones
 *   (Action Engine) y restricciones. No reimplementa nada del framework.
 * - `recommendTemplates` / `recommendByGoal`: dado un objetivo comercial (o una
 *   frase de negocio), sugiere las plantillas adecuadas. Es la base del "sistema
 *   que ayuda a decidir qué promoción crear".
 */

import type { Promotion } from '../domain/types'
import type { PromotionService } from '../application/promotion-service'
import type { ActorRef } from '../application/promotion-service'
import {
  instantiatePromotionTemplate,
  type PromotionTemplate,
  type PromotionTemplateOverrides,
} from './template-types'
import { PROMOTION_OBJECTIVES, type PromotionObjective } from './taxonomy'

/**
 * Crea una promoción a partir de una plantilla, reutilizando el Promotion
 * Framework: create → setActions (beneficio → acción) → setRestrictions.
 */
export async function createPromotionFromTemplate(
  service: PromotionService,
  template: PromotionTemplate,
  companyId: string,
  overrides: PromotionTemplateOverrides = {},
  actor: ActorRef = {},
): Promise<Promotion> {
  const { create, actions, restrictions } = instantiatePromotionTemplate(template, companyId, overrides)
  const promo = await service.create({ ...create, createdById: actor.userId ?? null })
  if (actions.length > 0) await service.setActions(promo.id, actions, actor)
  if (restrictions.length > 0) await service.setRestrictions(promo.id, restrictions, actor)
  return (await service.get(promo.id)) ?? promo
}

/** Filtra una biblioteca de plantillas por objetivo comercial. */
export function recommendTemplates(
  templates: readonly PromotionTemplate[],
  objective: PromotionObjective,
): PromotionTemplate[] {
  return templates.filter((t) => t.objective === objective)
}

/** Palabras clave → objetivo comercial (para consultas en lenguaje natural). */
const GOAL_KEYWORDS: ReadonlyArray<[readonly string[], PromotionObjective]> = [
  [['inactiv', 'recuper', 'perdid', 'volver', 'extrañ'], PROMOTION_OBJECTIVES.RECOVERY],
  [['nuevo', 'capta', 'atraer', 'adquir'], PROMOTION_OBJECTIVES.CAPTURE],
  [['primera compra', 'primer lavado', 'probar'], PROMOTION_OBJECTIVES.FIRST_PURCHASE],
  [['frecuen', 'visit', 'recurren'], PROMOTION_OBJECTIVES.FREQUENCY],
  [['reten', 'fideliz', 'mantener'], PROMOTION_OBJECTIVES.RETENTION],
  [['ticket', 'gast', 'vender más', 'combo'], PROMOTION_OBJECTIVES.TICKET],
  [['premium', 'detailing', 'alto margen', 'protecc'], PROMOTION_OBJECTIVES.PREMIUM],
  [['membres', 'suscrip'], PROMOTION_OBJECTIVES.MEMBERSHIP],
  [['temporada', 'navidad', 'black friday', 'aniversario', 'fin de semana'], PROMOTION_OBJECTIVES.SEASONAL],
  [['refer', 'amigo', 'embajador', 'recomend'], PROMOTION_OBJECTIVES.REFERRAL],
  [['convert', 'conversion', 'conversión'], PROMOTION_OBJECTIVES.CONVERSION],
  [['competitiv', 'ia', 'personaliz', 'automátic'], PROMOTION_OBJECTIVES.COMPETITIVE],
]

/** Deduce el objetivo comercial a partir de una frase (ej. "recuperar inactivos"). */
export function objectiveFromGoal(goal: string): PromotionObjective | null {
  const text = goal.toLowerCase()
  for (const [keywords, objective] of GOAL_KEYWORDS) {
    if (keywords.some((k) => text.includes(k))) return objective
  }
  return null
}

/**
 * Recomienda plantillas a partir de una frase de negocio. Devuelve el objetivo
 * detectado y las plantillas que lo cumplen (con sus segmentos, beneficios y
 * métricas ya definidos).
 */
export function recommendByGoal(
  templates: readonly PromotionTemplate[],
  goal: string,
): { objective: PromotionObjective | null; templates: PromotionTemplate[] } {
  const objective = objectiveFromGoal(goal)
  return {
    objective,
    templates: objective ? recommendTemplates(templates, objective) : [],
  }
}
