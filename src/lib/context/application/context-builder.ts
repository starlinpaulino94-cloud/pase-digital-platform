/**
 * ContextBuilder (Fase 5): construye un RuleContext combinando proveedores.
 *
 * Es el corazón del Modelo Universal de Contexto. Toma una petición, ejecuta los
 * proveedores registrados (respetando dependencias y política de seguridad) y
 * produce un `RuleContext` (el mismo tipo que consume el Rule Engine). Soporta:
 *   - carga parcial (solo los namespaces pedidos),
 *   - resolución de dependencias entre proveedores (`dependsOn`),
 *   - memoización dentro de una construcción,
 *   - carga diferida (lazy) vía `createLazyContext`.
 *
 * El Rule Engine nunca consulta la BD: recibe el contexto ya construido.
 */

import type { RuleContext } from '@/lib/rule-engine'
import type { ContextProviderRegistry } from '../domain/registry'
import type { ContextRequest } from '../domain/provider'
import { AllowAllPolicy, type ContextAccessPolicy } from '../domain/security'

export interface ContextBuilderDeps {
  readonly registry: ContextProviderRegistry
  readonly policy?: ContextAccessPolicy
}

export interface BuildOptions {
  /** Namespaces a cargar (carga parcial). Por defecto: todos los registrados. */
  readonly namespaces?: readonly string[]
  /** Consumidor para la política de seguridad (permisos por namespace). */
  readonly consumer?: string
}

export class ContextBuilder {
  private readonly registry: ContextProviderRegistry
  private readonly policy: ContextAccessPolicy

  constructor(deps: ContextBuilderDeps) {
    this.registry = deps.registry
    this.policy = deps.policy ?? new AllowAllPolicy()
  }

  /**
   * Construye el contexto de forma EAGER (resolviendo ya los namespaces pedidos).
   * Carga parcial: pasa `options.namespaces` para limitar.
   */
  async build(request: ContextRequest, options: BuildOptions = {}): Promise<RuleContext> {
    const resolver = new NamespaceResolver(this.registry, this.policy, request)
    const targets = this.targetNamespaces(options)
    for (const ns of targets) {
      if (this.policy.canAccess(ns, options.consumer)) {
        await resolver.resolve(ns)
      }
    }
    return this.toRuleContext(request, resolver.snapshot())
  }

  /**
   * Crea un contexto DIFERIDO (lazy): no resuelve nada hasta que se pide un
   * namespace, y memoiza. `materialize()` produce un RuleContext concreto para
   * pasárselo al Rule Engine.
   */
  createLazyContext(request: ContextRequest, options: BuildOptions = {}): LazyContext {
    return new LazyContext(
      new NamespaceResolver(this.registry, this.policy, request),
      request,
      this.policy,
      options.consumer,
      (data) => this.toRuleContext(request, data),
      this.targetNamespaces(options),
    )
  }

  private targetNamespaces(options: BuildOptions): readonly string[] {
    return options.namespaces ?? this.registry.namespaces()
  }

  private toRuleContext(request: ContextRequest, data: Record<string, unknown>): RuleContext {
    return {
      companyId: request.companyId,
      timestamp: request.timestamp ?? new Date(),
      channel: request.channel,
      data,
      meta: request.meta ?? {},
    }
  }
}

/**
 * Contexto diferido: resuelve namespaces bajo demanda y memoiza. Útil para
 * cargar solo lo que cada regla realmente consulta (optimización futura).
 */
export class LazyContext {
  constructor(
    private readonly resolver: NamespaceResolver,
    private readonly request: ContextRequest,
    private readonly policy: ContextAccessPolicy,
    private readonly consumer: string | undefined,
    private readonly build: (data: Record<string, unknown>) => RuleContext,
    private readonly targets: readonly string[],
  ) {}

  /** Resuelve (y memoiza) un namespace bajo demanda. */
  async get(namespace: string): Promise<unknown | undefined> {
    if (!this.policy.canAccess(namespace, this.consumer)) return undefined
    return this.resolver.resolve(namespace)
  }

  /**
   * Materializa un RuleContext concreto resolviendo los namespaces indicados
   * (o todos los objetivo). Reutiliza lo ya memoizado.
   */
  async materialize(namespaces?: readonly string[]): Promise<RuleContext> {
    const targets = namespaces ?? this.targets
    for (const ns of targets) {
      if (this.policy.canAccess(ns, this.consumer)) await this.resolver.resolve(ns)
    }
    return this.build(this.resolver.snapshot())
  }
}

/**
 * Resolutor con memoización y detección de ciclos. Resuelve un namespace tras
 * sus dependencias (`dependsOn`), una sola vez por construcción.
 */
class NamespaceResolver {
  private readonly resolved = new Map<string, unknown>()
  private readonly visiting = new Set<string>()

  constructor(
    private readonly registry: ContextProviderRegistry,
    private readonly policy: ContextAccessPolicy,
    private readonly request: ContextRequest,
  ) {}

  async resolve(namespace: string): Promise<unknown | undefined> {
    if (this.resolved.has(namespace)) return this.resolved.get(namespace)
    if (this.visiting.has(namespace)) return undefined // corta ciclos
    const provider = this.registry.get(namespace)
    if (!provider) return undefined

    this.visiting.add(namespace)
    // Resuelve dependencias primero (para que provide() pueda leerlas).
    for (const dep of provider.dependsOn ?? []) {
      await this.resolve(dep)
    }
    const value = await provider.provide({
      request: this.request,
      resolve: (ns) => this.resolved.get(ns),
    })
    this.visiting.delete(namespace)

    if (value !== undefined) this.resolved.set(namespace, value)
    return value
  }

  /** Copia de los namespaces resueltos hasta ahora. */
  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.resolved)
  }
}
