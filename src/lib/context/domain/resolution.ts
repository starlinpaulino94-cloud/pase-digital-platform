/**
 * Resolución de variables del contexto (Fase 5).
 *
 * Resuelve rutas tipo `cliente.nombre` o `membresia.visitasDisponibles` sobre un
 * RuleContext ya construido. Reutiliza el resolvedor del Rule Engine
 * (`resolveField`) para no duplicar la semántica de dot-paths. Sin expresiones
 * complejas todavía: solo acceso por ruta.
 */

import { resolveField, type RuleContext } from '@/lib/rule-engine'
import { splitPath } from './namespaces'

/** Resuelve una ruta del contexto. Devuelve `undefined` si no existe. */
export function resolvePath(context: RuleContext, path: string): unknown {
  return resolveField(context, path)
}

/** ¿Existe el namespace (primer segmento) en el contexto? */
export function hasNamespace(context: RuleContext, path: string): boolean {
  const { namespace } = splitPath(path)
  return Object.prototype.hasOwnProperty.call(context.data, namespace)
}

/** Lista los namespaces presentes en el contexto construido. */
export function namespacesOf(context: RuleContext): string[] {
  return Object.keys(context.data)
}
