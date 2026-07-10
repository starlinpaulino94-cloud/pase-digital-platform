/**
 * Proveedores genéricos (Fase 5): el PATRÓN para aportar namespaces sin acoplar
 * el núcleo del contexto a Prisma.
 *
 * - `StaticContextProvider`: devuelve datos ya presentes en `request.refs[ns]`.
 *   Útil cuando el llamante ya tiene el objeto (o en pruebas).
 * - `createLoaderProvider`: envuelve un LOADER async (que sí puede consultar la
 *   BD, viviendo FUERA de este módulo). Así se escribe, por ejemplo, un
 *   ClienteProvider real: `createLoaderProvider('cliente', ({request}) =>
 *   cargarClienteDesdeDB(request.refs.clienteId))`.
 *
 * El Rule Engine nunca ve estos loaders: solo consume el contexto resultante.
 */

import type { ContextProvider, ProviderInput } from '../domain/provider'

/**
 * Proveedor que toma el objeto directamente de `request.refs[namespace]`
 * (si es un objeto). No consulta nada.
 */
export class StaticContextProvider implements ContextProvider {
  constructor(readonly namespace: string) {}

  provide({ request }: ProviderInput): unknown | undefined {
    const value = request.refs?.[this.namespace]
    return value && typeof value === 'object' ? value : undefined
  }
}

/** Función que carga el objeto de un namespace (puede ser async y usar la BD). */
export type ContextLoader<T = unknown> = (
  input: ProviderInput,
) => Promise<T | undefined> | T | undefined

/**
 * Crea un proveedor a partir de un loader. Es el patrón que seguirán los
 * proveedores respaldados por base de datos, definidos fuera de este módulo.
 */
export function createLoaderProvider<T = unknown>(
  namespace: string,
  loader: ContextLoader<T>,
  options: { dependsOn?: readonly string[] } = {},
): ContextProvider<T> {
  return {
    namespace,
    dependsOn: options.dependsOn,
    provide: (input) => loader(input),
  }
}
