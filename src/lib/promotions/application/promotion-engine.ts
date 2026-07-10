/**
 * PromotionEngine: puente que REUTILIZA el Rule Engine (Fases 1-2) y el Action
 * Engine (Fase 3). La promoción no evalúa condiciones ni ejecuta acciones por su
 * cuenta: delega íntegramente en los motores ya construidos.
 *
 * - Evaluar elegibilidad → carga las reglas mapeadas y las evalúa con el
 *   RuleEvaluator (obtiene RuleResult por regla).
 * - Ejecutar acciones → convierte las acciones de la promoción a la forma que
 *   consume el ActionExecutor y las ejecuta (sin handlers en esta fase → NO_HANDLER).
 *
 * NO contiene lógica comercial: es orquestación genérica.
 */

import type {
  ActionContext,
  ActionExecutionReport,
  ActionExecutor,
  Rule,
  RuleAction,
  RuleContext,
  RuleEvaluator,
  RuleResult,
} from '@/lib/rule-engine'
import type { Promotion, PromotionActionDef } from '../domain/types'

export interface PromotionEngineDeps {
  readonly ruleEvaluator: RuleEvaluator
  readonly actionExecutor: ActionExecutor
  /** Cargador de reglas del Rule Engine (reutiliza su repositorio). */
  readonly loadRule: (ruleId: string) => Promise<Rule | null>
}

/** Resultado de evaluar la elegibilidad de una promoción. */
export interface PromotionEvaluation {
  readonly promotionId: string
  /** Elegible si TODAS las reglas mapeadas se cumplen (AND). */
  readonly eligible: boolean
  /** Resultado por regla (del Rule Engine). */
  readonly ruleResults: readonly RuleResult[]
  /** Ids de reglas mapeadas que no se encontraron (config inconsistente). */
  readonly missingRuleIds: readonly string[]
}

export class PromotionEngine {
  constructor(private readonly deps: PromotionEngineDeps) {}

  /**
   * Evalúa la elegibilidad reutilizando el Rule Engine: carga cada regla mapeada
   * y la evalúa contra el contexto. Elegible = todas válidas.
   */
  async evaluate(promotion: Promotion, context: RuleContext): Promise<PromotionEvaluation> {
    const ruleResults: RuleResult[] = []
    const missingRuleIds: string[] = []

    const ordered = [...promotion.rules].sort((a, b) => a.order - b.order)
    for (const ref of ordered) {
      const rule = await this.deps.loadRule(ref.ruleId)
      if (!rule) {
        missingRuleIds.push(ref.ruleId)
        continue
      }
      ruleResults.push(this.deps.ruleEvaluator.evaluateToResult(rule, context))
    }

    // Sin reglas mapeadas → elegible (promoción incondicional). Con reglas → AND.
    const eligible =
      missingRuleIds.length === 0 && ruleResults.every((r) => r.valid)

    return { promotionId: promotion.id, eligible, ruleResults, missingRuleIds }
  }

  /**
   * Ejecuta las acciones de la promoción reutilizando el Action Engine. En esta
   * fase no hay handlers registrados: el informe reflejará NO_HANDLER.
   */
  async executeActions(
    promotion: Promotion,
    context: ActionContext,
  ): Promise<ActionExecutionReport> {
    const syntheticRule = promotionAsActionCarrier(promotion)
    return this.deps.actionExecutor.execute(syntheticRule, context)
  }
}

/** Convierte una acción de promoción a la forma RuleAction del Action Engine. */
export function toRuleAction(action: PromotionActionDef): RuleAction {
  return {
    id: action.id,
    type: action.type,
    params: action.params,
    order: action.order,
    required: action.required,
    maxRetries: action.maxRetries,
    enabled: action.enabled,
    version: action.version,
  }
}

/**
 * Construye una "regla portadora" mínima con las acciones de la promoción, para
 * pasarla al ActionExecutor sin duplicar su API. No se evalúa: solo transporta
 * las acciones y la identidad de la promoción.
 */
function promotionAsActionCarrier(promotion: Promotion): Rule {
  return {
    id: promotion.id,
    companyId: promotion.companyId,
    group: null,
    name: promotion.name,
    description: promotion.description,
    status: 'PUBLISHED',
    isActive: true,
    priority: promotion.priority,
    version: promotion.version,
    matchType: 'ALL',
    validFrom: null,
    validUntil: null,
    conditions: [],
    conditionTree: null,
    actions: [...promotion.actions].sort((a, b) => a.order - b.order).map(toRuleAction),
    createdAt: promotion.createdAt,
    updatedAt: promotion.updatedAt,
  }
}
