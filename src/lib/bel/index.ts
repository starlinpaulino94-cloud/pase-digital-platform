/**
 * Business Expression Language (BEL) — Fase 7. API pública y composition root.
 *
 * Lenguaje declarativo, legible y seguro (sin eval) para evaluar expresiones,
 * fórmulas y cálculos de negocio. Trabaja sobre el Universal Context Model
 * (Fase 5) y el Business Data Dictionary (Fase 6). Reutilizable por cualquier
 * módulo; es el lenguaje oficial de reglas de MembeGo.
 *
 * @example
 *   import { createExpressionService } from '@/lib/bel'
 *   const bel = createExpressionService()
 *   const r = bel.evaluate('cliente.edad >= 18 AND compra.total > 2000', context)
 *   // r = { ok: true, value: true, type: 'BOOLEAN', issues: [] }
 */

import { ExpressionService, type ExpressionServiceOptions } from './application/expression-service'

/** Composition root: crea el servicio con funciones y caché por defecto. */
export function createExpressionService(options: ExpressionServiceOptions = {}): ExpressionService {
  return new ExpressionService(options)
}

// ── Re-exports públicos ─────────────────────────────────────────────────────
// Dominio
export type {
  ExpressionNode, LiteralNode, VariableNode, ListNode, ObjectNode, UnaryNode,
  ArithmeticNode, ComparisonNode, LogicalNode, MembershipNode, TextNode,
  PostfixNode, CallNode,
} from './domain/ast'
export { collectVariables, collectFunctions, isConstant } from './domain/ast'
export type { BelType, BelValue } from './domain/values'
export { belTypeOf, belEquals, isEmpty } from './domain/values'
export type { BelErrorCode, BelIssue, ExpressionResult } from './domain/result'
export { BelError } from './domain/result'
export {
  FunctionRegistry,
  createDefaultFunctionRegistry,
} from './domain/functions'
export type { BelFunction, BelFunctionContext } from './domain/functions'

// Aplicación
export { ExpressionService, contextVariableChecker } from './application/expression-service'
export type {
  ExpressionServiceOptions, EvaluateOptions, ParseResult,
} from './application/expression-service'
export { tokenize } from './application/tokenizer'
export type { Token, TokenType } from './application/tokenizer'
export { parse } from './application/parser'
export type { ParserOptions } from './application/parser'
export { Evaluator } from './application/evaluator'
export { Compiler } from './application/compiler'
export type { CompiledExpression } from './application/compiler'
export { Validator } from './application/validator'
export type { VariableChecker, ValidateOptions } from './application/validator'
export {
  NoopExpressionCache,
  InMemoryExpressionCache,
} from './application/ports'
export type { ExpressionCache } from './application/ports'
export { createExpressionConditionType } from './application/rule-engine-bridge'
