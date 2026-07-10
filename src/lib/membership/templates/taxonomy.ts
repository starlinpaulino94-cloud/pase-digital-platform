/**
 * Taxonomía de la Membership Strategy Library (Fase F1.1).
 *
 * Clasifica cada modelo de membresía por: modelo comercial (= MembershipPlanType),
 * objetivo comercial y público objetivo. Datos, no lógica: son catálogos
 * reutilizables que cualquier UI o motor de descubrimiento puede consumir.
 */

/** Objetivo comercial que persigue una estrategia de membresía. */
export type MembershipObjective =
  | 'captacion'
  | 'retencion'
  | 'frecuencia'
  | 'ticket_promedio'
  | 'fidelizacion'
  | 'recuperacion'
  | 'upselling'

/** Público objetivo de una estrategia. */
export type MembershipAudience =
  | 'individual'
  | 'familias'
  | 'empresas'
  | 'flotas'
  | 'frecuentes'
  | 'vip'
  | 'nuevos'

/** Nivel de complejidad operativa de la estrategia. */
export type StrategyComplexity = 'baja' | 'media' | 'alta'

/** Identificadores de los motores del ecosistema (para declarar integración). */
export type EngineId =
  | 'rule'
  | 'action'
  | 'membership'
  | 'benefit'
  | 'promotion'
  | 'reward'
  | 'referral'
  | 'campaign'
  | 'automation'
  | 'gamification'
  | 'analytics'
  | 'decision'
  | 'template'

export interface TaxonomyEntry<T extends string> {
  readonly id: T
  readonly name: string
  readonly description: string
}

export const MEMBERSHIP_OBJECTIVES: readonly TaxonomyEntry<MembershipObjective>[] = [
  { id: 'captacion', name: 'Captación', description: 'Atraer nuevos clientes a la membresía.' },
  { id: 'retencion', name: 'Retención', description: 'Mantener a los miembros y reducir bajas.' },
  { id: 'frecuencia', name: 'Frecuencia', description: 'Aumentar la cantidad de visitas por cliente.' },
  { id: 'ticket_promedio', name: 'Ticket promedio', description: 'Elevar el gasto por visita/cliente.' },
  { id: 'fidelizacion', name: 'Fidelización', description: 'Construir relación y permanencia de largo plazo.' },
  { id: 'recuperacion', name: 'Recuperación', description: 'Reactivar clientes inactivos o vencidos.' },
  { id: 'upselling', name: 'Upselling', description: 'Escalar al cliente a niveles/servicios superiores.' },
]

export const MEMBERSHIP_AUDIENCES: readonly TaxonomyEntry<MembershipAudience>[] = [
  { id: 'individual', name: 'Cliente individual', description: 'Un vehículo, un titular.' },
  { id: 'familias', name: 'Familias', description: 'Varios vehículos de un mismo hogar.' },
  { id: 'empresas', name: 'Empresas', description: 'Beneficio corporativo para empleados.' },
  { id: 'flotas', name: 'Flotas', description: 'Rentadoras, dealers, logística con muchos vehículos.' },
  { id: 'frecuentes', name: 'Clientes frecuentes', description: 'Alta recurrencia de uso.' },
  { id: 'vip', name: 'Clientes VIP', description: 'Alto valor, experiencia premium.' },
  { id: 'nuevos', name: 'Nuevos clientes', description: 'Primer contacto, aún sin fidelizar.' },
]

/** Tipos de vehículo compatibles (Car Wash). */
export const CARWASH_VEHICLE_TYPES = [
  'sedan',
  'suv',
  'pickup',
  'motocicleta',
  'van',
  'camion_ligero',
  'lujo',
] as const
export type CarwashVehicleType = (typeof CARWASH_VEHICLE_TYPES)[number]

export const STRATEGY_COMPLEXITY: readonly TaxonomyEntry<StrategyComplexity>[] = [
  { id: 'baja', name: 'Baja', description: 'Instalación directa, poca configuración.' },
  { id: 'media', name: 'Media', description: 'Requiere ajustar reglas/beneficios.' },
  { id: 'alta', name: 'Alta', description: 'Múltiples motores, reglas y segmentación.' },
]
