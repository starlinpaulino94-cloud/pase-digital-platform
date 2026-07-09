/**
 * RuleContext: el objeto UNIVERSAL que recibe el motor para evaluar reglas.
 *
 * Es un contenedor genérico y extensible: bajo `data` viven espacios de nombre
 * arbitrarios (empresa, cliente, sucursal, usuario, compra, qr, membresía…)
 * que las fases futuras irán poblando SIN tocar el motor. El núcleo solo sabe
 * resolver rutas (dot-paths) dentro de este objeto; no conoce el significado de
 * ningún namespace concreto (Open/Closed).
 */

/** Claves reservadas de primer nivel, siempre disponibles en el contexto. */
export const RESERVED_FIELDS = {
  /** Momento de la evaluación (Date). */
  NOW: '$now',
  /** Empresa dueña de la evaluación (multi-tenant). */
  COMPANY_ID: '$companyId',
  /** Canal por el que llega la petición (web, app, qr, api…). */
  CHANNEL: '$channel',
} as const

export interface RuleContext {
  /** Empresa sobre la que se evalúan las reglas (aislamiento multi-tenant). */
  readonly companyId: string
  /** Instante de la evaluación. Inyectable para pruebas deterministas. */
  readonly timestamp: Date
  /** Canal de origen, opcional. */
  readonly channel?: string
  /** Espacios de nombre arbitrarios con los datos del caso de uso. */
  readonly data: Readonly<Record<string, unknown>>
  /** Metadatos técnicos (dispositivo, ip hash, request id…). */
  readonly meta: Readonly<Record<string, unknown>>
}

/**
 * Construye un RuleContext de forma incremental y segura. Cada empresa/fase
 * puede añadir sus propios namespaces sin que el motor cambie.
 *
 * @example
 *   const ctx = new RuleContextBuilder(companyId)
 *     .at(new Date())
 *     .channel('qr')
 *     .set('cliente', { puntos: 120, membresiaActiva: true })
 *     .set('sucursal', { id: 'suc_1' })
 *     .build()
 */
export class RuleContextBuilder {
  private timestamp: Date = new Date()
  private channelValue?: string
  private readonly dataMap = new Map<string, unknown>()
  private readonly metaMap = new Map<string, unknown>()

  constructor(private readonly companyId: string) {}

  /** Fija el instante de evaluación (por defecto: ahora). */
  at(timestamp: Date): this {
    this.timestamp = timestamp
    return this
  }

  /** Fija el canal de origen. */
  channel(channel: string): this {
    this.channelValue = channel
    return this
  }

  /** Registra un namespace de datos, ej. set('cliente', {...}). */
  set(namespace: string, value: unknown): this {
    this.dataMap.set(namespace, value)
    return this
  }

  /** Mezcla varios namespaces de una vez. */
  merge(data: Record<string, unknown>): this {
    for (const [k, v] of Object.entries(data)) this.dataMap.set(k, v)
    return this
  }

  /** Añade un metadato técnico. */
  withMeta(key: string, value: unknown): this {
    this.metaMap.set(key, value)
    return this
  }

  build(): RuleContext {
    return {
      companyId: this.companyId,
      timestamp: this.timestamp,
      channel: this.channelValue,
      data: Object.fromEntries(this.dataMap),
      meta: Object.fromEntries(this.metaMap),
    }
  }
}

/**
 * Resuelve un dot-path contra el contexto. Soporta las claves reservadas
 * ($now, $companyId, $channel) y rutas anidadas dentro de `data`
 * (ej. "cliente.membresia.estado"). Devuelve `undefined` si algún segmento no
 * existe; nunca lanza. Es la ÚNICA forma en que el motor "lee" datos de negocio,
 * lo que lo mantiene 100% desacoplado.
 */
export function resolveField(context: RuleContext, path: string): unknown {
  if (!path) return undefined

  switch (path) {
    case RESERVED_FIELDS.NOW:
      return context.timestamp
    case RESERVED_FIELDS.COMPANY_ID:
      return context.companyId
    case RESERVED_FIELDS.CHANNEL:
      return context.channel
  }

  const segments = path.split('.')
  let current: unknown = context.data
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return undefined
    // Seguridad: solo se accede a propiedades PROPIAS. Nunca a heredadas del
    // prototipo (`constructor`, `__proto__`, `toString`…), para no exponer
    // clases internas ni permitir prototype pollution en la resolución.
    if (!Object.prototype.hasOwnProperty.call(current, segment)) return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}
