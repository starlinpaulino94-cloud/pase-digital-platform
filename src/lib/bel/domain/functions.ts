/**
 * Function Registry del BEL (Fase 7).
 *
 * Registro EXTENSIBLE de funciones. Cada función se registra de forma
 * independiente; añadir una nueva NUNCA requiere modificar el Expression Engine
 * (Open/Closed). Incluye un conjunto inicial; el sistema soporta cientos.
 */

import { BelError } from './result'
import { belTypeOf, type BelValue } from './values'

/** Contexto disponible para las funciones (determinismo: `now` inyectable). */
export interface BelFunctionContext {
  readonly now: Date
}

export interface BelFunction {
  readonly name: string
  /** Nº mínimo de argumentos. */
  readonly minArgs: number
  /** Nº máximo (-1 = variádica). */
  readonly maxArgs: number
  readonly description?: string
  evaluate(args: BelValue[], ctx: BelFunctionContext): BelValue
}

export class FunctionRegistry {
  private readonly fns = new Map<string, BelFunction>()

  register(fn: BelFunction): this {
    this.fns.set(fn.name.toUpperCase(), fn)
    return this
  }

  has(name: string): boolean {
    return this.fns.has(name.toUpperCase())
  }

  get(name: string): BelFunction | undefined {
    return this.fns.get(name.toUpperCase())
  }

  list(): BelFunction[] {
    return [...this.fns.values()]
  }
}

// ── Coerciones auxiliares ────────────────────────────────────────────────────

function toNum(value: BelValue, fn: string): number {
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  throw new BelError('TYPE_ERROR', `${fn}: se esperaba un número, se recibió ${belTypeOf(value)}.`)
}

function toDate(value: BelValue, fn: string): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  throw new BelError('TYPE_ERROR', `${fn}: se esperaba una fecha.`)
}

function toStr(value: BelValue): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

/** Crea el registro con el conjunto inicial de funciones. */
export function createDefaultFunctionRegistry(): FunctionRegistry {
  const r = new FunctionRegistry()
  const fns: BelFunction[] = [
    { name: 'IF', minArgs: 3, maxArgs: 3, description: 'IF(cond, a, b)', evaluate: (a) => (a[0] === true ? a[1] : a[2]) },
    { name: 'COALESCE', minArgs: 1, maxArgs: -1, description: 'Primer valor no nulo', evaluate: (a) => a.find((x) => x !== null && x !== undefined) ?? null },
    { name: 'MIN', minArgs: 1, maxArgs: -1, evaluate: (a) => Math.min(...a.map((x) => toNum(x, 'MIN'))) },
    { name: 'MAX', minArgs: 1, maxArgs: -1, evaluate: (a) => Math.max(...a.map((x) => toNum(x, 'MAX'))) },
    { name: 'ABS', minArgs: 1, maxArgs: 1, evaluate: (a) => Math.abs(toNum(a[0], 'ABS')) },
    { name: 'ROUND', minArgs: 1, maxArgs: 2, evaluate: (a) => { const d = a[1] !== undefined ? toNum(a[1], 'ROUND') : 0; const f = 10 ** d; return Math.round(toNum(a[0], 'ROUND') * f) / f } },
    { name: 'UPPER', minArgs: 1, maxArgs: 1, evaluate: (a) => toStr(a[0]).toUpperCase() },
    { name: 'LOWER', minArgs: 1, maxArgs: 1, evaluate: (a) => toStr(a[0]).toLowerCase() },
    { name: 'LENGTH', minArgs: 1, maxArgs: 1, evaluate: (a) => (Array.isArray(a[0]) ? a[0].length : toStr(a[0]).length) },
    { name: 'CONCAT', minArgs: 1, maxArgs: -1, evaluate: (a) => a.map(toStr).join('') },
    { name: 'SUBSTRING', minArgs: 2, maxArgs: 3, evaluate: (a) => { const s = toStr(a[0]); const start = toNum(a[1], 'SUBSTRING'); const len = a[2] !== undefined ? toNum(a[2], 'SUBSTRING') : undefined; return len === undefined ? s.slice(start) : s.slice(start, start + len) } },
    { name: 'TODAY', minArgs: 0, maxArgs: 0, evaluate: (_a, ctx) => { const d = new Date(ctx.now); d.setHours(0, 0, 0, 0); return d } },
    { name: 'NOW', minArgs: 0, maxArgs: 0, evaluate: (_a, ctx) => new Date(ctx.now) },
    { name: 'YEAR', minArgs: 1, maxArgs: 1, evaluate: (a) => toDate(a[0], 'YEAR').getFullYear() },
    { name: 'MONTH', minArgs: 1, maxArgs: 1, evaluate: (a) => toDate(a[0], 'MONTH').getMonth() + 1 },
    { name: 'DAY', minArgs: 1, maxArgs: 1, evaluate: (a) => toDate(a[0], 'DAY').getDate() },
    { name: 'HOUR', minArgs: 1, maxArgs: 1, evaluate: (a) => toDate(a[0], 'HOUR').getHours() },
    { name: 'DATEDIFF', minArgs: 2, maxArgs: 2, description: 'Días de a a b', evaluate: (a) => Math.floor((toDate(a[1], 'DATEDIFF').getTime() - toDate(a[0], 'DATEDIFF').getTime()) / 86_400_000) },
  ]
  for (const fn of fns) r.register(fn)
  return r
}
