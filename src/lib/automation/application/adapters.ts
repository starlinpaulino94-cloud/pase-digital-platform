/**
 * Adaptadores que cablean el Automation Engine (Fase E1) al Rule/Expression
 * Engine (condiciones) y al Action Engine (acciones). El motor solo conoce los
 * PUERTOS; aquí se conectan los motores reales, cumpliendo el requisito:
 * "todas las condiciones pasan por el Rule Engine y todas las acciones por el
 * Action Engine".
 */

import { RuleContextBuilder } from '@/lib/rule-engine'
import type { ExpressionService } from '@/lib/bel'
import type { ActionDispatcher, ConditionEvaluator, VariableResolver } from './ports'
import type { AutomationActionSpec } from '../domain/types'
import type { VariableContext } from '../domain/variables'

/**
 * ConditionEvaluator sobre el Expression Engine (BEL) — el lenguaje universal
 * de condiciones del Rule Engine. NUNCA lanza (BEL devuelve resultado
 * estructurado); una condición inválida se considera NO cumplida.
 */
export class BelConditionEvaluator implements ConditionEvaluator {
  constructor(private readonly expressions: ExpressionService) {}

  async evaluate(
    expression: string,
    ctx: VariableContext,
  ): Promise<{ passed: boolean; detail?: unknown }> {
    const builder = new RuleContextBuilder('automation')
    for (const [ns, value] of Object.entries(ctx)) builder.set(ns, value)
    const res = this.expressions.evaluate(expression, builder.build())
    if (!res.ok) return { passed: false, detail: { issues: res.issues } }
    return { passed: res.value === true, detail: { value: res.value } }
  }
}

/** Puerto mínimo del Action Engine que el adaptador necesita. */
export interface ActionSink {
  /** Ejecuta una acción por su tipo con parámetros ya interpolados. */
  run(input: {
    companyId: string
    subjectId: string | null
    type: string
    params: Record<string, unknown>
  }): Promise<{ ok: boolean; detail?: unknown }>
}

/**
 * ActionDispatcher sobre el Action Engine. El motor de automatizaciones NO
 * ejecuta acciones: las delega a este sink (implementado por el Action Engine).
 */
export class ActionEngineDispatcher implements ActionDispatcher {
  constructor(private readonly sink: ActionSink) {}

  dispatch(
    action: AutomationActionSpec,
    ctx: { companyId: string; subjectId: string | null; variables: VariableContext },
  ): Promise<{ ok: boolean; detail?: unknown }> {
    return this.sink.run({
      companyId: ctx.companyId,
      subjectId: ctx.subjectId,
      type: action.type,
      params: (action.params ?? {}) as Record<string, unknown>,
    })
  }
}

/**
 * Sink por defecto: registra la acción como intención sin ejecutarla (todos los
 * motores de la Strategy Library están construidos pero aún no cableados a la
 * app). Cuando se conecte el Action Engine con handlers reales, se sustituye
 * este sink por uno que los invoque, sin tocar el motor.
 */
export class RecordingActionSink implements ActionSink {
  readonly recorded: { type: string; params: Record<string, unknown> }[] = []
  async run(input: { type: string; params: Record<string, unknown> }): Promise<{ ok: boolean; detail?: unknown }> {
    this.recorded.push({ type: input.type, params: input.params })
    return { ok: true, detail: { recorded: true } }
  }
}

/**
 * VariableResolver por defecto: expone los datos del trigger como namespaces de
 * variables (ej. el evento trae `{ cliente: {...} }`). El resolutor definitivo
 * se cableará al Context/Dictionary Engine para cargar el sujeto desde la BD,
 * sin tocar el motor.
 */
export class TriggerVariableResolver implements VariableResolver {
  async resolve(input: {
    companyId: string
    subjectId: string | null
    trigger: Readonly<Record<string, unknown>>
  }): Promise<VariableContext> {
    const ctx: Record<string, Record<string, unknown>> = {}
    for (const [ns, value] of Object.entries(input.trigger)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        ctx[ns] = value as Record<string, unknown>
      }
    }
    ctx.contexto = { companyId: input.companyId, subjectId: input.subjectId }
    return ctx
  }
}
