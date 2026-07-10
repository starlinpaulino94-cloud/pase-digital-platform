/**
 * Evaluator del BEL (Fase 7): recorre el AST y calcula el valor.
 *
 * Trabaja SOLO sobre el Universal Context Model (resuelve variables con
 * `resolveField`) y el Function Registry. Nunca accede a entidades del sistema ni
 * ejecuta código. Valida tipos en cada operación y lanza `BelError` (control de
 * flujo) que el servicio convierte en resultado estructurado.
 */

import { resolveField, type RuleContext } from '@/lib/rule-engine'
import type { ExpressionNode } from '../domain/ast'
import type { FunctionRegistry } from '../domain/functions'
import { BelError } from '../domain/result'
import {
  belEquals, belTypeOf, isEmpty, likeToRegExp, toComparableNumber,
  type BelValue,
} from '../domain/values'

export interface EvaluatorDeps {
  readonly functions: FunctionRegistry
  /** Instante para funciones NOW/TODAY (determinismo). */
  readonly now?: Date
}

export class Evaluator {
  constructor(private readonly deps: EvaluatorDeps) {}

  evaluate(node: ExpressionNode, context: RuleContext): BelValue {
    switch (node.kind) {
      case 'Literal':
        return node.value
      case 'Variable': {
        const v = resolveField(context, node.path)
        return (v ?? null) as BelValue
      }
      case 'List':
        return node.elements.map((e) => this.evaluate(e, context))
      case 'Object':
        return Object.fromEntries(node.entries.map((e) => [e.key, this.evaluate(e.value, context)]))
      case 'Unary':
        return this.evalUnary(node, context)
      case 'Arithmetic':
        return this.evalArithmetic(node, context)
      case 'Comparison':
        return this.evalComparison(node, context)
      case 'Logical':
        return this.evalLogical(node, context)
      case 'Membership':
        return this.evalMembership(node, context)
      case 'Text':
        return this.evalText(node, context)
      case 'Postfix':
        return this.evalPostfix(node, context)
      case 'Call':
        return this.evalCall(node, context)
    }
  }

  private asBoolean(value: BelValue, ctx: string): boolean {
    if (typeof value !== 'boolean') {
      throw new BelError('TYPE_ERROR', `${ctx}: se esperaba un booleano, se recibió ${belTypeOf(value)}.`)
    }
    return value
  }

  private asNumber(value: BelValue, ctx: string): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new BelError('TYPE_ERROR', `${ctx}: se esperaba un número, se recibió ${belTypeOf(value)}.`)
    }
    return value
  }

  private evalUnary(node: Extract<ExpressionNode, { kind: 'Unary' }>, ctx: RuleContext): BelValue {
    const v = this.evaluate(node.operand, ctx)
    if (node.op === 'NOT') return !this.asBoolean(v, 'NOT')
    return -this.asNumber(v, 'negación (-)')
  }

  private evalArithmetic(node: Extract<ExpressionNode, { kind: 'Arithmetic' }>, ctx: RuleContext): BelValue {
    const a = this.asNumber(this.evaluate(node.left, ctx), `operador "${node.op}"`)
    const b = this.asNumber(this.evaluate(node.right, ctx), `operador "${node.op}"`)
    switch (node.op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': if (b === 0) throw new BelError('DIVISION_BY_ZERO', 'División por cero.'); return a / b
      case '%': if (b === 0) throw new BelError('DIVISION_BY_ZERO', 'Módulo por cero.'); return a % b
      case '^': return a ** b
    }
  }

  private evalComparison(node: Extract<ExpressionNode, { kind: 'Comparison' }>, ctx: RuleContext): BelValue {
    const a = this.evaluate(node.left, ctx)
    const b = this.evaluate(node.right, ctx)
    if (node.op === '==') return belEquals(a, b)
    if (node.op === '!=') return !belEquals(a, b)

    const ta = belTypeOf(a)
    const tb = belTypeOf(b)
    let cmp: number
    if ((ta === 'NUMBER' || ta === 'DATE') && (tb === 'NUMBER' || tb === 'DATE')) {
      cmp = Math.sign(toComparableNumber(a) - toComparableNumber(b))
    } else if (ta === 'STRING' && tb === 'STRING') {
      cmp = (a as string) < (b as string) ? -1 : (a as string) > (b as string) ? 1 : 0
    } else {
      throw new BelError('TYPE_ERROR', `No se puede comparar ${ta} con ${tb} usando "${node.op}".`)
    }
    switch (node.op) {
      case '>': return cmp > 0
      case '>=': return cmp >= 0
      case '<': return cmp < 0
      case '<=': return cmp <= 0
    }
  }

  private evalLogical(node: Extract<ExpressionNode, { kind: 'Logical' }>, ctx: RuleContext): BelValue {
    const left = this.asBoolean(this.evaluate(node.left, ctx), `operador ${node.op}`)
    // Corto-circuito en AND/OR.
    if (node.op === 'AND' && !left) return false
    if (node.op === 'OR' && left) return true
    const right = this.asBoolean(this.evaluate(node.right, ctx), `operador ${node.op}`)
    switch (node.op) {
      case 'AND': return left && right
      case 'OR': return left || right
      case 'XOR': return left !== right
    }
  }

  private evalMembership(node: Extract<ExpressionNode, { kind: 'Membership' }>, ctx: RuleContext): BelValue {
    const a = this.evaluate(node.left, ctx)
    const b = this.evaluate(node.right, ctx)
    if (node.op === 'IN' || node.op === 'NOT_IN') {
      if (!Array.isArray(b)) throw new BelError('TYPE_ERROR', `"${node.op}" requiere una lista a la derecha.`)
      const found = b.some((x) => belEquals(a, x))
      return node.op === 'IN' ? found : !found
    }
    // CONTAINS / NOT_CONTAINS: a es lista o texto
    let found: boolean
    if (Array.isArray(a)) found = a.some((x) => belEquals(x, b))
    else if (typeof a === 'string') found = a.includes(String(b))
    else throw new BelError('TYPE_ERROR', `"${node.op}" requiere lista o texto a la izquierda.`)
    return node.op === 'CONTAINS' ? found : !found
  }

  private evalText(node: Extract<ExpressionNode, { kind: 'Text' }>, ctx: RuleContext): BelValue {
    const a = this.evaluate(node.left, ctx)
    const b = this.evaluate(node.right, ctx)
    if (typeof a !== 'string' || typeof b !== 'string') {
      throw new BelError('TYPE_ERROR', `"${node.op}" requiere texto en ambos lados.`)
    }
    switch (node.op) {
      case 'STARTS_WITH': return a.startsWith(b)
      case 'ENDS_WITH': return a.endsWith(b)
      case 'MATCHES':
        try { return new RegExp(b).test(a) } catch { throw new BelError('TYPE_ERROR', `Expresión regular inválida: "${b}".`) }
      case 'LIKE': return likeToRegExp(b).test(a)
    }
  }

  private evalPostfix(node: Extract<ExpressionNode, { kind: 'Postfix' }>, ctx: RuleContext): BelValue {
    const v = this.evaluate(node.operand, ctx)
    switch (node.op) {
      case 'IS_NULL': return v === null || v === undefined
      case 'IS_NOT_NULL': return v !== null && v !== undefined
      case 'EMPTY': return isEmpty(v)
      case 'NOT_EMPTY': return !isEmpty(v)
    }
  }

  private evalCall(node: Extract<ExpressionNode, { kind: 'Call' }>, ctx: RuleContext): BelValue {
    const fn = this.deps.functions.get(node.name)
    if (!fn) throw new BelError('UNKNOWN_FUNCTION', `Función no registrada: "${node.name}".`)
    const arity = node.args.length
    if (arity < fn.minArgs || (fn.maxArgs !== -1 && arity > fn.maxArgs)) {
      const range = fn.maxArgs === -1 ? `≥ ${fn.minArgs}` : fn.minArgs === fn.maxArgs ? `${fn.minArgs}` : `${fn.minArgs}-${fn.maxArgs}`
      throw new BelError('ARITY_ERROR', `${node.name} espera ${range} argumento(s), recibió ${arity}.`)
    }
    const args = node.args.map((a) => this.evaluate(a, ctx))
    try {
      return fn.evaluate(args, { now: this.deps.now ?? ctx.timestamp ?? new Date() })
    } catch (err) {
      if (err instanceof BelError) throw err
      throw new BelError('RUNTIME_ERROR', `Error en ${node.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}
