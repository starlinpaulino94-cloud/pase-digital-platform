/**
 * Context Providers (Fase 5).
 *
 * Cada módulo aporta información al contexto a través de un ContextProvider, que
 * es responsable de UN namespace. El proveedor recibe la petición (identificadores
 * + entorno) y devuelve el objeto de contexto de su namespace. Puede leer de la
 * BD (mediante loaders inyectados), pero el Rule Engine NUNCA lo hace: siempre
 * trabaja sobre el contexto ya construido.
 */

/**
 * Petición de contexto: identifica QUÉ resolver. Contiene la empresa, el entorno
 * (variables dinámicas) y `refs` con identificadores/datos crudos que los
 * proveedores usan para cargar su objeto.
 */
export interface ContextRequest {
  readonly companyId: string
  readonly timestamp?: Date
  readonly channel?: string
  readonly locale?: string
  readonly timezone?: string
  readonly currency?: string
  readonly country?: string
  readonly city?: string
  readonly ip?: string
  readonly device?: string
  /** Identificadores o datos crudos por namespace, ej. { clienteId, compra: {...} }. */
  readonly refs?: Readonly<Record<string, unknown>>
  /** Metadatos técnicos que se propagarán al RuleContext. */
  readonly meta?: Readonly<Record<string, unknown>>
}

/** Lo que recibe un proveedor al resolver su namespace. */
export interface ProviderInput {
  readonly request: ContextRequest
  /** Acceso a namespaces YA resueltos (los declarados en `dependsOn`). */
  resolve(namespace: string): unknown | undefined
}

/**
 * Contrato de un proveedor de contexto. `namespace` es el espacio que aporta;
 * `dependsOn` declara namespaces que deben resolverse antes (para proveedores
 * que derivan de otros, ej. membresía a partir de cliente).
 */
export interface ContextProvider<T = unknown> {
  readonly namespace: string
  readonly dependsOn?: readonly string[]
  /**
   * Devuelve el objeto de contexto del namespace, o `undefined` si no aplica
   * (p. ej. no hay identificador en la petición). Puede ser async (lazy/DB).
   * NUNCA debe lanzar por ausencia de datos: devuelve undefined.
   */
  provide(input: ProviderInput): Promise<T | undefined> | T | undefined
}
