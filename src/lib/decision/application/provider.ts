/**
 * Puerto de Decision Provider (Fase E1.10). Un proveedor sabe decidir uno o
 * varios `DecisionKind`. Hoy sólo existe el Rule Based Provider; en el futuro se
 * añaden AI/ML/Statistical/Custom implementando esta misma interfaz, sin tocar el
 * Decision Engine ni el resto del sistema.
 */

import type { DecisionKind, DecisionRequest, DecisionResult } from '../domain/types'

export interface DecisionProvider {
  /** Identificador del proveedor (ej. "rule_based", futuro "ai"). */
  readonly kind: string
  /** ¿Este proveedor puede decidir este tipo de decisión? */
  supports(kind: DecisionKind): boolean
  /** Decide (NUNCA ejecuta acciones). Puede ser sincrónico o asíncrono. */
  decide(request: DecisionRequest): DecisionResult | Promise<DecisionResult>
}

/** Entrada del registro con prioridad (mayor = se consulta antes). */
interface ProviderEntry {
  readonly provider: DecisionProvider
  readonly priority: number
}

/**
 * Registro de proveedores. Soporta MÚLTIPLES proveedores activos a la vez para
 * un mismo `DecisionKind` (el Decision Engine puede combinarlos). Agregar o
 * quitar proveedores no requiere cambiar la arquitectura.
 */
export class DecisionProviderRegistry {
  private entries: ProviderEntry[] = []

  /** Registra un proveedor (idempotente por `kind`). */
  register(provider: DecisionProvider, opts: { priority?: number } = {}): void {
    this.unregister(provider.kind)
    this.entries.push({ provider, priority: opts.priority ?? 0 })
    this.entries.sort((a, b) => b.priority - a.priority)
  }

  /** Quita un proveedor por su `kind`. */
  unregister(kind: string): void {
    this.entries = this.entries.filter((e) => e.provider.kind !== kind)
  }

  /** Todos los proveedores registrados, por prioridad. */
  list(): readonly DecisionProvider[] {
    return this.entries.map((e) => e.provider)
  }

  /** Proveedores que soportan un tipo de decisión, por prioridad. */
  forKind(kind: DecisionKind): readonly DecisionProvider[] {
    return this.entries.filter((e) => e.provider.supports(kind)).map((e) => e.provider)
  }
}
