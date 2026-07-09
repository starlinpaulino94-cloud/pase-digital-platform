/**
 * Catálogo Universal de Restricciones (Fase 4).
 *
 * Declara —como DATOS— los tipos de restricción que una promoción puede tener.
 * NO contiene validación programada: solo la arquitectura (tipo + ámbito +
 * ventana). Las validaciones reales se implementarán en fases posteriores,
 * consumiendo estos tipos. Añadir una restricción = sumar aquí, sin tocar nada.
 */

/** Ámbito sobre el que se cuenta la restricción. */
export type RestrictionScope =
  | 'GLOBAL'
  | 'COMPANY'
  | 'CLIENT'
  | 'BRANCH'
  | 'EMPLOYEE'
  | 'CAMPAIGN'

/** Ventana temporal sobre la que se acumula el conteo (o NONE = total). */
export type RestrictionWindow = 'NONE' | 'DAY' | 'WEEK' | 'MONTH'

export interface RestrictionDefinition {
  readonly id: string
  readonly scope: RestrictionScope
  readonly window: RestrictionWindow
  readonly description: string
}

/** Claves de restricción como constantes tipadas. */
export const RESTRICTION_TYPES = {
  MAX_USES_TOTAL: 'max_uses_total',
  MAX_USES_GLOBAL: 'max_uses_global',
  PER_CLIENT: 'per_client',
  PER_COMPANY: 'per_company',
  PER_BRANCH: 'per_branch',
  PER_EMPLOYEE: 'per_employee',
  PER_DAY: 'per_day',
  PER_WEEK: 'per_week',
  PER_MONTH: 'per_month',
  PER_CAMPAIGN: 'per_campaign',
} as const

export type RestrictionTypeKey = (typeof RESTRICTION_TYPES)[keyof typeof RESTRICTION_TYPES]

/** Definiciones del catálogo. */
export const RESTRICTION_CATALOG: readonly RestrictionDefinition[] = [
  { id: RESTRICTION_TYPES.MAX_USES_TOTAL, scope: 'GLOBAL', window: 'NONE', description: 'Cantidad máxima de usos en total.' },
  { id: RESTRICTION_TYPES.MAX_USES_GLOBAL, scope: 'GLOBAL', window: 'NONE', description: 'Cantidad global (toda la plataforma).' },
  { id: RESTRICTION_TYPES.PER_CLIENT, scope: 'CLIENT', window: 'NONE', description: 'Cantidad por cliente.' },
  { id: RESTRICTION_TYPES.PER_COMPANY, scope: 'COMPANY', window: 'NONE', description: 'Cantidad por empresa.' },
  { id: RESTRICTION_TYPES.PER_BRANCH, scope: 'BRANCH', window: 'NONE', description: 'Cantidad por sucursal.' },
  { id: RESTRICTION_TYPES.PER_EMPLOYEE, scope: 'EMPLOYEE', window: 'NONE', description: 'Cantidad por empleado.' },
  { id: RESTRICTION_TYPES.PER_DAY, scope: 'GLOBAL', window: 'DAY', description: 'Cantidad por día.' },
  { id: RESTRICTION_TYPES.PER_WEEK, scope: 'GLOBAL', window: 'WEEK', description: 'Cantidad por semana.' },
  { id: RESTRICTION_TYPES.PER_MONTH, scope: 'GLOBAL', window: 'MONTH', description: 'Cantidad por mes.' },
  { id: RESTRICTION_TYPES.PER_CAMPAIGN, scope: 'CAMPAIGN', window: 'NONE', description: 'Cantidad por campaña.' },
]

const BY_ID = new Map(RESTRICTION_CATALOG.map((d) => [d.id, d]))

export function getRestrictionDefinition(id: string): RestrictionDefinition | undefined {
  return BY_ID.get(id)
}

export function isCatalogRestriction(id: string): boolean {
  return BY_ID.has(id)
}
