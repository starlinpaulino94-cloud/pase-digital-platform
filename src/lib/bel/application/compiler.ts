/**
 * Compiler del BEL (Fase 7): parsea una expresión a un AST reutilizable y lo
 * cachea. La "compilación" separa el análisis (una vez) de la evaluación
 * (muchas veces), base de las optimizaciones de rendimiento.
 */

import { collectFunctions, collectVariables, isConstant, type ExpressionNode } from '../domain/ast'
import { parse, type ParserOptions } from './parser'
import { InMemoryExpressionCache, type ExpressionCache } from './ports'

/** Resultado de compilar: AST + metadatos derivados. */
export interface CompiledExpression {
  readonly source: string
  readonly ast: ExpressionNode
  readonly variables: readonly string[]
  readonly functions: readonly string[]
  /** ¿La expresión es constante (sin variables/funciones)? Base de constant-folding. */
  readonly constant: boolean
}

export class Compiler {
  constructor(
    private readonly cache: ExpressionCache = new InMemoryExpressionCache(),
    private readonly parserOptions: ParserOptions = {},
  ) {}

  /** Compila (o reutiliza de caché) una expresión. Puede lanzar BelError de sintaxis. */
  compile(source: string): CompiledExpression {
    const cached = this.cache.get(source)
    if (cached) return cached
    const ast = parse(source, this.parserOptions)
    const compiled: CompiledExpression = {
      source,
      ast,
      variables: [...collectVariables(ast)],
      functions: [...collectFunctions(ast)],
      constant: isConstant(ast),
    }
    this.cache.set(source, compiled)
    return compiled
  }
}
