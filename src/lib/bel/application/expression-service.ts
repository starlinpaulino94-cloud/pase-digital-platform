/**
 * ExpressionService: API interna del BEL (Fase 7).
 *
 * Fachada única: validar, parsear, compilar, evaluar, registrar funciones y
 * consultarlas. `evaluate` NUNCA lanza: devuelve un ExpressionResult
 * estructurado. Todo ocurre en el entorno controlado del BEL (sin eval).
 */

import { resolveField, type RuleContext } from '@/lib/rule-engine'
import type { ExpressionNode } from '../domain/ast'
import {
  createDefaultFunctionRegistry, type BelFunction, type FunctionRegistry,
} from '../domain/functions'
import { BelError, type ExpressionResult } from '../domain/result'
import { belTypeOf } from '../domain/values'
import { Compiler, type CompiledExpression } from './compiler'
import { Evaluator } from './evaluator'
import type { ExpressionCache } from './ports'
import { Validator, type ValidateOptions } from './validator'
import type { ParserOptions } from './parser'

export interface ExpressionServiceOptions {
  readonly functions?: FunctionRegistry
  readonly cache?: ExpressionCache
  readonly parserOptions?: ParserOptions
}

export interface EvaluateOptions {
  /** Instante para NOW/TODAY. Por defecto: el timestamp del contexto. */
  readonly now?: Date
}

/** Resultado de parsear (sin evaluar). */
export type ParseResult =
  | { readonly ok: true; readonly ast: ExpressionNode }
  | { readonly ok: false; readonly issues: ExpressionResult['issues'] }

export class ExpressionService {
  private readonly functions: FunctionRegistry
  private readonly compiler: Compiler
  private readonly validator: Validator

  constructor(options: ExpressionServiceOptions = {}) {
    this.functions = options.functions ?? createDefaultFunctionRegistry()
    this.compiler = new Compiler(options.cache, options.parserOptions)
    this.validator = new Validator(this.compiler, this.functions)
  }

  /** Valida una expresión (sintaxis, variables, funciones, aridad). */
  validate(source: string, options?: ValidateOptions) {
    return this.validator.validate(source, options)
  }

  /** Parsea a AST, devolviendo issues en vez de lanzar. */
  parse(source: string): ParseResult {
    try {
      return { ok: true, ast: this.compiler.compile(source).ast }
    } catch (err) {
      return { ok: false, issues: [err instanceof BelError ? err.toIssue() : { code: 'SYNTAX_ERROR', message: String(err) }] }
    }
  }

  /** Compila (parsea + cachea) una expresión. Puede lanzar BelError de sintaxis. */
  compile(source: string): CompiledExpression {
    return this.compiler.compile(source)
  }

  /**
   * Evalúa una expresión (o AST ya compilado) contra el contexto. Nunca lanza:
   * cualquier error se reporta en `issues`.
   */
  evaluate(
    source: string | CompiledExpression,
    context: RuleContext,
    options: EvaluateOptions = {},
  ): ExpressionResult {
    let ast: ExpressionNode
    try {
      ast = typeof source === 'string' ? this.compiler.compile(source).ast : source.ast
    } catch (err) {
      return this.fail(err)
    }

    try {
      const now = options.now ?? context.timestamp ?? new Date()
      const value = new Evaluator({ functions: this.functions, now }).evaluate(ast, context)
      return { ok: true, value, type: belTypeOf(value), issues: [] }
    } catch (err) {
      return this.fail(err)
    }
  }

  /** Registra una función nueva (Open/Closed). */
  registerFunction(fn: BelFunction): this {
    this.functions.register(fn)
    return this
  }

  /** Lista las funciones disponibles. */
  listFunctions(): BelFunction[] {
    return this.functions.list()
  }

  private fail(err: unknown): ExpressionResult {
    const issue = err instanceof BelError ? err.toIssue() : { code: 'RUNTIME_ERROR' as const, message: String(err) }
    return { ok: false, value: undefined, type: undefined, issues: [issue] }
  }
}

/** Utilidad: comprobador de variables que exige que exista en el contexto. */
export function contextVariableChecker(context: RuleContext) {
  return (path: string) => resolveField(context, path) !== undefined
}
