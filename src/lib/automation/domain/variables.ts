/**
 * Variables dinámicas del Automation Engine (Fase E1). Ninguna automatización
 * usa valores fijos: usa variables del cliente/contexto. Catálogo universal +
 * interpolación de plantillas de texto (`{{namespace.campo}}`) contra un
 * contexto de variables (que provee el Context/Dictionary Engine).
 */

export interface AutomationVariableDef {
  readonly id: string
  readonly name: string
  readonly namespace: string
}

/** Catálogo universal de variables (no específico de industria). */
export const AUTOMATION_VARIABLE_CATALOG: readonly AutomationVariableDef[] = [
  { id: 'cliente.nombre', name: 'Nombre del cliente', namespace: 'cliente' },
  { id: 'cliente.edad', name: 'Edad', namespace: 'cliente' },
  { id: 'cliente.cumpleanos', name: 'Fecha de cumpleaños', namespace: 'cliente' },
  { id: 'cliente.visitas', name: 'Cantidad de visitas', namespace: 'cliente' },
  { id: 'cliente.vehiculo', name: 'Vehículo', namespace: 'cliente' },
  { id: 'cliente.membresia', name: 'Membresía', namespace: 'cliente' },
  { id: 'cliente.sucursal', name: 'Sucursal', namespace: 'cliente' },
  { id: 'cliente.ciudad', name: 'Ciudad', namespace: 'cliente' },
  { id: 'cliente.segmento', name: 'Segmento', namespace: 'cliente' },
  { id: 'cliente.puntos', name: 'Puntos', namespace: 'cliente' },
  { id: 'cliente.nivel', name: 'Nivel', namespace: 'cliente' },
  { id: 'cliente.historial', name: 'Historial', namespace: 'cliente' },
  { id: 'cliente.ultima_compra', name: 'Última compra', namespace: 'cliente' },
  { id: 'cliente.proxima_renovacion', name: 'Próxima renovación', namespace: 'cliente' },
]

/** Contexto de variables: namespaces → objetos planos. */
export type VariableContext = Readonly<Record<string, Readonly<Record<string, unknown>>>>

/** Resuelve una ruta "namespace.campo[.sub]" contra el contexto (solo props propias). */
export function resolveVariable(ctx: VariableContext, path: string): unknown {
  const segments = path.split('.')
  let current: unknown = ctx
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined
    if (!Object.prototype.hasOwnProperty.call(current, seg)) return undefined
    current = (current as Record<string, unknown>)[seg]
  }
  return current
}

const TEMPLATE_RE = /\{\{\s*([\w.]+)\s*\}\}/g

/** Interpola `{{cliente.nombre}}` en un texto con el contexto de variables. */
export function interpolate(text: string, ctx: VariableContext): string {
  return text.replace(TEMPLATE_RE, (_m, path: string) => {
    const v = resolveVariable(ctx, path)
    return v == null ? '' : String(v)
  })
}

/** Interpola recursivamente todos los strings de un objeto de parámetros. */
export function interpolateParams(
  params: Readonly<Record<string, unknown>> | undefined,
  ctx: VariableContext,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!params) return out
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string') out[k] = interpolate(v, ctx)
    else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = interpolateParams(v as Record<string, unknown>, ctx)
    } else out[k] = v
  }
  return out
}
