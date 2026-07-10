/**
 * Modelo Universal de Contexto (Fase 5) — API pública y composition root.
 *
 * Construye el `RuleContext` que consume el Rule Engine combinando Context
 * Providers (uno por namespace). El Rule Engine nunca consulta la BD: siempre
 * trabaja sobre el contexto construido aquí. Añadir un módulo = registrar un
 * proveedor, sin tocar el Rule Engine ni el builder.
 *
 * @example
 *   import { createContextBuilder, createLoaderProvider, NAMESPACES } from '@/lib/context'
 *
 *   const builder = createContextBuilder({
 *     providers: [
 *       createLoaderProvider(NAMESPACES.CLIENTE, ({ request }) =>
 *         cargarCliente(request.refs?.clienteId as string)),
 *     ],
 *   })
 *   const context = await builder.build(
 *     { companyId, refs: { clienteId }, channel: 'qr' },
 *     { namespaces: ['cliente', 'sistema'] }, // carga parcial
 *   )
 *   // context es un RuleContext listo para engine.run(...)
 */

import { ContextProviderRegistry } from './domain/registry'
import type { ContextProvider } from './domain/provider'
import type { ContextAccessPolicy } from './domain/security'
import { ContextBuilder } from './application/context-builder'
import { SystemContextProvider } from './providers/system-provider'

export interface CreateContextBuilderOptions {
  /** Proveedores adicionales a registrar (además del de sistema). */
  providers?: ContextProvider[]
  /** Política de acceso por namespace. Por defecto: permitir todo. */
  policy?: ContextAccessPolicy
  /** Registro base a reutilizar. Por defecto: uno nuevo con el proveedor de sistema. */
  registry?: ContextProviderRegistry
}

/** Registro con los proveedores estándar (hoy: `sistema.*`). */
export function defaultContextRegistry(): ContextProviderRegistry {
  return new ContextProviderRegistry().register(new SystemContextProvider())
}

/** Composition root: arma un ContextBuilder con el proveedor de sistema + extras. */
export function createContextBuilder(options: CreateContextBuilderOptions = {}): ContextBuilder {
  const registry = options.registry ?? defaultContextRegistry()
  for (const provider of options.providers ?? []) registry.register(provider)
  return new ContextBuilder({ registry, policy: options.policy })
}

// ── Re-exports públicos ─────────────────────────────────────────────────────
export { NAMESPACES, splitPath, isStandardNamespace } from './domain/namespaces'
export type { NamespaceKey } from './domain/namespaces'
export type {
  ClienteContext,
  EmpresaContext,
  SucursalContext,
  EmpleadoContext,
  UsuarioContext,
  VehiculoContext,
  CompraContext,
  ProductoContext,
  ServicioContext,
  QrContext,
  MembresiaContext,
  SistemaContext,
} from './domain/objects'
export { ContextProviderRegistry } from './domain/registry'
export type { ContextProvider, ContextRequest, ProviderInput } from './domain/provider'
export {
  AllowAllPolicy,
  NamespaceAllowlistPolicy,
} from './domain/security'
export type { ContextAccessPolicy } from './domain/security'
export { resolvePath, hasNamespace, namespacesOf } from './domain/resolution'
export { SystemContextProvider } from './providers/system-provider'
export {
  StaticContextProvider,
  createLoaderProvider,
} from './providers/static-provider'
export type { ContextLoader } from './providers/static-provider'
export { ContextBuilder, LazyContext } from './application/context-builder'
export type { ContextBuilderDeps, BuildOptions } from './application/context-builder'
export { NoopContextCache } from './application/ports'
export type { ContextCache } from './application/ports'
