/**
 * ActionContext: el contexto UNIVERSAL que reciben las acciones (Fase 3).
 *
 * Análogo al RuleContext, pero orientado a la EJECUCIÓN: además de los datos del
 * caso de uso (empresa, cliente, empleado, sucursal, qr, compra, membresía…),
 * transporta la información CALCULADA por el Rule Engine (el RuleResult y el id
 * de la regla que disparó la acción). Es completamente extensible: las fases
 * futuras añaden namespaces a `data` sin tocar el motor de acciones.
 */

import type { RuleContext } from './context'
import type { RuleResult } from './rule-result'

export interface ActionContext {
  /** Empresa dueña de la ejecución (aislamiento multi-tenant). */
  readonly companyId: string
  /** Instante de la ejecución. */
  readonly timestamp: Date
  /** Canal de origen (web, app, qr, api…). */
  readonly channel?: string
  /** Namespaces de datos del caso de uso (mismos que el RuleContext + extras). */
  readonly data: Readonly<Record<string, unknown>>
  /** Metadatos técnicos (dispositivo, request id, ip hash…). */
  readonly meta: Readonly<Record<string, unknown>>
  /** Regla que originó la ejecución (si aplica). */
  readonly ruleId?: string
  /** Resultado del Rule Engine: información calculada disponible para las acciones. */
  readonly ruleResult?: RuleResult
}

/** Construye un ActionContext de forma incremental. */
export class ActionContextBuilder {
  private timestamp: Date = new Date()
  private channelValue?: string
  private ruleIdValue?: string
  private ruleResultValue?: RuleResult
  private readonly dataMap = new Map<string, unknown>()
  private readonly metaMap = new Map<string, unknown>()

  constructor(private readonly companyId: string) {}

  at(timestamp: Date): this {
    this.timestamp = timestamp
    return this
  }

  channel(channel: string | undefined): this {
    this.channelValue = channel
    return this
  }

  set(namespace: string, value: unknown): this {
    this.dataMap.set(namespace, value)
    return this
  }

  merge(data: Record<string, unknown>): this {
    for (const [k, v] of Object.entries(data)) this.dataMap.set(k, v)
    return this
  }

  withMeta(key: string, value: unknown): this {
    this.metaMap.set(key, value)
    return this
  }

  fromRule(ruleId: string, ruleResult?: RuleResult): this {
    this.ruleIdValue = ruleId
    this.ruleResultValue = ruleResult
    return this
  }

  build(): ActionContext {
    return {
      companyId: this.companyId,
      timestamp: this.timestamp,
      channel: this.channelValue,
      data: Object.fromEntries(this.dataMap),
      meta: Object.fromEntries(this.metaMap),
      ruleId: this.ruleIdValue,
      ruleResult: this.ruleResultValue,
    }
  }
}

/**
 * Deriva un ActionContext a partir del RuleContext usado en la evaluación,
 * añadiendo la información calculada por el Rule Engine. Así las acciones ven
 * exactamente el mismo mundo que la regla, más su veredicto.
 */
export function actionContextFromRule(
  context: RuleContext,
  opts: { ruleId?: string; ruleResult?: RuleResult } = {},
): ActionContext {
  return {
    companyId: context.companyId,
    timestamp: context.timestamp,
    channel: context.channel,
    data: context.data,
    meta: context.meta,
    ruleId: opts.ruleId,
    ruleResult: opts.ruleResult,
  }
}
