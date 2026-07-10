/**
 * Puertos de rendimiento del BEL (Fase 7): caché de AST compilados.
 *
 * Prepara compilación/memoización/reutilización de expresiones frecuentes. El
 * compilador consulta la caché antes de re-parsear.
 */

import type { CompiledExpression } from './compiler'

export interface ExpressionCache {
  get(source: string): CompiledExpression | undefined
  set(source: string, compiled: CompiledExpression): void
}

/** No cachea (por defecto). */
export class NoopExpressionCache implements ExpressionCache {
  get(): undefined {
    return undefined
  }
  set(): void {}
}

/** Caché en memoria con límite simple (evicción FIFO). */
export class InMemoryExpressionCache implements ExpressionCache {
  private readonly map = new Map<string, CompiledExpression>()
  constructor(private readonly maxSize = 1000) {}

  get(source: string): CompiledExpression | undefined {
    return this.map.get(source)
  }

  set(source: string, compiled: CompiledExpression): void {
    if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value
      if (oldest !== undefined) this.map.delete(oldest)
    }
    this.map.set(source, compiled)
  }
}
