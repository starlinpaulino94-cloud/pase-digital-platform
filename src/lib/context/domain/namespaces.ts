/**
 * Namespaces del Modelo Universal de Contexto (Fase 5).
 *
 * El contexto se organiza en espacios de nombre (`cliente.*`, `empresa.*`,
 * `sistema.*`…). Cada proveedor aporta UN namespace. El Rule Engine resuelve
 * rutas como `cliente.nombre` sin conocer de dónde salió el dato.
 */

/** Namespaces estándar. Añadir uno nuevo es sumar aquí (o registrarlo libremente). */
export const NAMESPACES = {
  CLIENTE: 'cliente',
  EMPRESA: 'empresa',
  SUCURSAL: 'sucursal',
  EMPLEADO: 'empleado',
  USUARIO: 'usuario',
  COMPRA: 'compra',
  FACTURA: 'factura',
  PRODUCTO: 'producto',
  SERVICIO: 'servicio',
  VEHICULO: 'vehiculo',
  MASCOTA: 'mascota',
  RESERVA: 'reserva',
  MESA: 'mesa',
  HABITACION: 'habitacion',
  PEDIDO: 'pedido',
  QR: 'qr',
  MEMBRESIA: 'membresia',
  BENEFICIOS: 'beneficios',
  SISTEMA: 'sistema',
} as const

export type NamespaceKey = (typeof NAMESPACES)[keyof typeof NAMESPACES]

/** Separa una ruta `namespace.resto.de.la.ruta` en sus partes. */
export function splitPath(path: string): { namespace: string; rest: string } {
  const dot = path.indexOf('.')
  if (dot === -1) return { namespace: path, rest: '' }
  return { namespace: path.slice(0, dot), rest: path.slice(dot + 1) }
}

/** ¿Es `value` un namespace estándar conocido? (los custom también son válidos). */
export function isStandardNamespace(value: string): boolean {
  return (Object.values(NAMESPACES) as string[]).includes(value)
}
