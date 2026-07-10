/**
 * ContextProviderRegistry (Fase 5).
 *
 * Registro centralizado de proveedores por namespace. Registrar uno nuevo NUNCA
 * requiere modificar el Rule Engine ni el Context Builder (Open/Closed).
 */

import type { ContextProvider } from './provider'

export class ContextProviderRegistry {
  private readonly providers = new Map<string, ContextProvider>()

  /** Registra (o reemplaza) el proveedor de un namespace. */
  register(provider: ContextProvider): this {
    this.providers.set(provider.namespace, provider)
    return this
  }

  has(namespace: string): boolean {
    return this.providers.has(namespace)
  }

  get(namespace: string): ContextProvider | undefined {
    return this.providers.get(namespace)
  }

  list(): ContextProvider[] {
    return [...this.providers.values()]
  }

  /** Namespaces registrados. */
  namespaces(): string[] {
    return [...this.providers.keys()]
  }
}
