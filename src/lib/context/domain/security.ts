/**
 * Seguridad del contexto (Fase 5).
 *
 * Prepara la arquitectura para PERMISOS por namespace: cada consumidor (módulo)
 * solo podrá acceder a la información necesaria. En esta fase se ofrece la
 * política "permitir todo" por defecto y una allowlist de ejemplo; las reglas
 * finas se aplicarán en fases futuras SIN tocar el builder.
 */

export interface ContextAccessPolicy {
  /** ¿Puede `consumer` acceder al namespace dado? */
  canAccess(namespace: string, consumer?: string): boolean
}

/** Política por defecto: acceso total. */
export class AllowAllPolicy implements ContextAccessPolicy {
  canAccess(): boolean {
    return true
  }
}

/**
 * Allowlist por consumidor: `{ scanner: ['cliente','membresia','sistema'] }`.
 * Un consumidor sin entrada (o sin consumer) obtiene acceso total salvo que se
 * configure `denyByDefault`.
 */
export class NamespaceAllowlistPolicy implements ContextAccessPolicy {
  constructor(
    private readonly allow: Readonly<Record<string, readonly string[]>>,
    private readonly denyByDefault = false,
  ) {}

  canAccess(namespace: string, consumer?: string): boolean {
    if (!consumer) return !this.denyByDefault
    const list = this.allow[consumer]
    if (!list) return !this.denyByDefault
    return list.includes(namespace)
  }
}
