/**
 * Puertos de rendimiento del Context Model (Fase 5).
 *
 * Prepara la arquitectura para caché/memoización de contextos sin implementarla
 * todavía. El builder consulta la caché antes de resolver; por defecto no cachea.
 */

import type { RuleContext } from '@/lib/rule-engine'

export interface ContextCache {
  get(key: string): Promise<RuleContext | null>
  set(key: string, context: RuleContext): Promise<void>
  invalidate(key: string): Promise<void>
}

/** Implementación por defecto: no cachea. */
export class NoopContextCache implements ContextCache {
  async get(): Promise<RuleContext | null> {
    return null
  }
  async set(): Promise<void> {}
  async invalidate(): Promise<void> {}
}
