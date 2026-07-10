/**
 * Biblioteca de plantillas de membresía para CAR WASH (Fase A, Industria 1).
 *
 * Datos, no código: cada modelo comercial de la Strategy Library se expresa como
 * una MembershipTemplate configurable. Un Car Wash instancia las que necesite y
 * ajusta precios/límites. El motor no contiene nada específico de Car Wash: toda
 * la especificidad vive aquí, como configuración.
 */

import type { MembershipPlanType } from '../domain/types'
import type { MembershipTemplate } from './types'

const SERVICES = {
  EXTERIOR: 'lavado_exterior',
  INTERIOR: 'lavado_interior',
  ASPIRADO: 'aspirado',
  PREMIUM: 'lavado_premium',
  DETAILING: 'detailing',
} as const

export const CARWASH_MEMBERSHIP_TEMPLATES: readonly MembershipTemplate[] = [
  // ── Nivel básico obligatorio ──
  {
    key: 'carwash.unlimited_basic',
    industry: 'carwash', name: 'Unlimited Básico', tier: 'basic',
    description: 'Lavados exteriores ilimitados (máx. 1 por día).',
    type: 'UNLIMITED', suggestedPrice: 999, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' }, minIntervalMinutes: 720, allowedServices: [SERVICES.EXTERIOR] },
      renewal: { auto: true, graceDays: 5 },
      metrics: ['uso_promedio', 'rentabilidad_por_miembro', 'cancelaciones'],
    },
  },
  {
    key: 'carwash.unlimited_premium',
    industry: 'carwash', name: 'Unlimited Premium', tier: 'basic',
    description: 'Exterior + interior + aspirado ilimitados y beneficios.',
    type: 'UNLIMITED', suggestedPrice: 1499, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR, SERVICES.ASPIRADO, SERVICES.PREMIUM],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' }, minIntervalMinutes: 720 },
      benefits: ['descuento_detailing_10'],
      renewal: { auto: true, graceDays: 5 },
      metrics: ['uso_promedio', 'visitas_promedio', 'rentabilidad_por_miembro'],
    },
  },
  {
    key: 'carwash.credits_basic',
    industry: 'carwash', name: 'Wash Credits · Basic', tier: 'basic',
    description: '5 lavados al mes. Control de costos.',
    type: 'CREDITS', suggestedPrice: 1000, currency: 'DOP', periodicity: 'MONTHLY', credits: 5,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR],
      limits: { maxCreditsRollover: 2, creditsTransferable: false },
      renewal: { auto: true },
      metrics: ['uso_promedio', 'cancelaciones'],
    },
  },
  {
    key: 'carwash.tier_silver',
    industry: 'carwash', name: 'Silver', tier: 'basic',
    description: '4 lavados básicos al mes.',
    type: 'TIER', suggestedPrice: 999, currency: 'DOP', periodicity: 'MONTHLY', credits: 4,
    config: { includedServices: [SERVICES.EXTERIOR], limits: { maxCreditsRollover: 0 }, metrics: ['uso_promedio'] },
  },
  {
    key: 'carwash.tier_gold',
    industry: 'carwash', name: 'Gold', tier: 'basic',
    description: '4 lavados premium al mes.',
    type: 'TIER', suggestedPrice: 1499, currency: 'DOP', periodicity: 'MONTHLY', credits: 4,
    config: { includedServices: [SERVICES.PREMIUM], benefits: ['puntos_dobles'], metrics: ['uso_promedio', 'visitas_promedio'] },
  },
  {
    key: 'carwash.tier_platinum',
    industry: 'carwash', name: 'Platinum', tier: 'basic',
    description: 'Lavados ilimitados premium.',
    type: 'TIER', suggestedPrice: 2499, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR, SERVICES.ASPIRADO, SERVICES.PREMIUM],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' } },
      benefits: ['linea_rapida', 'puntos_dobles'], metrics: ['rentabilidad_por_miembro'],
    },
  },
  {
    key: 'carwash.hybrid',
    industry: 'carwash', name: 'Hybrid Membership', tier: 'basic',
    description: '4 lavados premium + 10% en detailing + beneficios.',
    type: 'HYBRID', suggestedPrice: 1999, currency: 'DOP', periodicity: 'MONTHLY', credits: 4,
    config: {
      includedServices: [SERVICES.PREMIUM],
      benefits: ['descuento_detailing_10', 'beneficios_exclusivos'],
      limits: { maxCreditsRollover: 1 }, renewal: { auto: true }, metrics: ['uso_promedio', 'rentabilidad_por_miembro'],
    },
  },
  {
    key: 'carwash.family',
    industry: 'carwash', name: 'Family Membership', tier: 'basic',
    description: 'Varios vehículos en una cuenta con precio preferencial.',
    type: 'FAMILY', suggestedPrice: 2500, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.PREMIUM],
      limits: { maxVehicles: 3, maxPerPeriod: { count: 2, period: 'DAY' } },
      renewal: { auto: true }, metrics: ['uso_promedio', 'visitas_promedio'],
    },
  },

  // ── Nivel avanzado ──
  {
    key: 'carwash.fleet',
    industry: 'carwash', name: 'Fleet Membership', tier: 'advanced',
    description: 'Para empresas con flota de vehículos; consumo y reportes.',
    type: 'FLEET', suggestedPrice: 20000, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR],
      limits: { maxVehicles: 20 }, segments: ['empresas', 'dealers', 'rentadoras', 'hoteles'],
      metrics: ['uso_promedio', 'rentabilidad_por_miembro'], automations: ['reporte_mensual_flota'],
    },
  },
  {
    key: 'carwash.corporate',
    industry: 'carwash', name: 'Corporate Membership', tier: 'advanced',
    description: 'Beneficio Car Wash para empleados; la empresa paga.',
    type: 'CORPORATE', suggestedPrice: 15000, currency: 'DOP', periodicity: 'MONTHLY',
    config: { segments: ['corporativo'], benefits: ['beneficio_empleados'], metrics: ['uso_promedio'] },
  },
  {
    key: 'carwash.premium_service',
    industry: 'carwash', name: 'Premium Service', tier: 'advanced',
    description: '2 detailing + lavados premium + protección. Vehículos de lujo.',
    type: 'PREMIUM', suggestedPrice: 4999, currency: 'DOP', periodicity: 'MONTHLY', credits: 2,
    config: {
      includedServices: [SERVICES.DETAILING, SERVICES.PREMIUM], segments: ['lujo', 'ejecutivos'],
      benefits: ['proteccion_ceramica', 'linea_rapida'], metrics: ['rentabilidad_por_miembro', 'ltv'],
    },
  },
  {
    key: 'carwash.vip',
    industry: 'carwash', name: 'VIP Membership', tier: 'advanced',
    description: 'Experiencia exclusiva: línea rápida, prioridad, regalos, eventos.',
    type: 'VIP', suggestedPrice: 5999, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.PREMIUM, SERVICES.DETAILING],
      benefits: ['linea_rapida', 'atencion_prioritaria', 'regalos', 'eventos'],
      metrics: ['retencion', 'ltv'],
    },
  },
  {
    key: 'carwash.seasonal',
    industry: 'carwash', name: 'Seasonal Membership', tier: 'advanced',
    description: 'Membresía temporal (ej. 3 meses de verano/lluvia).',
    type: 'SEASONAL', suggestedPrice: 3500, currency: 'DOP', periodicity: 'SEASONAL', durationDays: 90, unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.PREMIUM],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' } }, metrics: ['uso_promedio', 'cancelaciones'],
    },
  },

  // ── Nivel inteligente ──
  {
    key: 'carwash.custom_builder',
    industry: 'carwash', name: 'Custom Builder', tier: 'smart',
    description: 'El cliente arma su plan (cantidad de lavados, servicios, beneficios).',
    type: 'CUSTOM', suggestedPrice: 0, currency: 'DOP', periodicity: 'MONTHLY',
    config: { metrics: ['uso_promedio', 'rentabilidad_por_miembro'], restrictions: ['precio_calculado_por_configuracion'] },
  },
  {
    key: 'carwash.rewards',
    industry: 'carwash', name: 'Membership + Rewards', tier: 'smart',
    description: 'Membresía con gamificación: XP aumentado, puntos dobles, misiones.',
    type: 'REWARDS', suggestedPrice: 1799, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.PREMIUM],
      benefits: ['xp_aumentado', 'puntos_dobles', 'misiones_exclusivas'],
      automations: ['gamificacion'], metrics: ['retencion', 'uso_promedio'],
    },
  },

  // ── Cobertura completa de la Strategy Library (20 modelos) ──
  {
    key: 'carwash.maintenance',
    industry: 'carwash', name: 'Plan Mantenimiento', tier: 'basic',
    description: 'Cuidado programado: 2 lavados premium + 1 encerado al mes.',
    type: 'MAINTENANCE', suggestedPrice: 1799, currency: 'DOP', periodicity: 'MONTHLY', credits: 3,
    config: {
      includedServices: [SERVICES.PREMIUM, SERVICES.DETAILING],
      limits: { maxCreditsRollover: 1, allowedServices: [SERVICES.PREMIUM, SERVICES.DETAILING] },
      benefits: ['encerado_mensual'], renewal: { auto: true, graceDays: 5 },
      automations: ['recordatorio_mantenimiento'],
      metrics: ['uso_promedio', 'retencion', 'rentabilidad_por_miembro'],
    },
  },
  {
    key: 'carwash.pay_per_visit',
    industry: 'carwash', name: 'Pay Per Visit', tier: 'basic',
    description: 'Sin cuota mensual: registro gratis y precio preferencial por visita.',
    type: 'PAY_PER_VISIT', suggestedPrice: 0, currency: 'DOP', periodicity: 'NONE',
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR, SERVICES.PREMIUM],
      restrictions: ['precio_preferencial_por_visita', 'sin_cuota_recurrente'],
      metrics: ['visitas_promedio', 'ltv', 'retencion'],
    },
  },
  {
    key: 'carwash.loyalty',
    industry: 'carwash', name: 'Club de Fidelidad', tier: 'basic',
    description: 'Acumula visitas y gana un lavado gratis cada 10.',
    type: 'LOYALTY', suggestedPrice: 0, currency: 'DOP', periodicity: 'NONE',
    config: {
      includedServices: [SERVICES.EXTERIOR],
      benefits: ['lavado_gratis_cada_10'],
      automations: ['sello_por_visita', 'recompensa_por_frecuencia'],
      metrics: ['visitas_promedio', 'retencion', 'tasa_renovacion'],
    },
  },
  {
    key: 'carwash.prepaid',
    industry: 'carwash', name: 'Prepago Anual', tier: 'basic',
    description: 'Paga 10 meses y recibe 12: lavados premium ilimitados todo el año.',
    type: 'PREPAID', suggestedPrice: 14990, currency: 'DOP', periodicity: 'ANNUAL', durationDays: 365, unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR, SERVICES.PREMIUM],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' } },
      renewal: { auto: false, prepaidMonths: 10, freeMonths: 2 },
      metrics: ['rentabilidad_por_miembro', 'ltv', 'retencion'],
    },
  },
  {
    key: 'carwash.trial',
    industry: 'carwash', name: 'Prueba 7 días', tier: 'basic',
    description: 'Prueba la experiencia una semana por precio simbólico. Solo clientes nuevos.',
    type: 'TRIAL', suggestedPrice: 199, currency: 'DOP', periodicity: 'ONE_TIME', durationDays: 7, unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.PREMIUM],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' } },
      restrictions: ['solo_clientes_nuevos', 'no_renovable'], renewal: { auto: false },
      automations: ['conversion_post_prueba'],
      metrics: ['tasa_renovacion', 'cancelaciones'],
    },
  },
  {
    key: 'carwash.student',
    industry: 'carwash', name: 'Plan Estudiante', tier: 'basic',
    description: '4 lavados exteriores al mes con precio especial para estudiantes.',
    type: 'STUDENT', suggestedPrice: 699, currency: 'DOP', periodicity: 'MONTHLY', credits: 4,
    config: {
      includedServices: [SERVICES.EXTERIOR], segments: ['estudiantes'],
      restrictions: ['requiere_verificacion_estudiantil'], renewal: { auto: true },
      metrics: ['uso_promedio', 'retencion'],
    },
  },
  {
    key: 'carwash.driver',
    industry: 'carwash', name: 'Plan Conductor', tier: 'advanced',
    description: 'Para taxistas, rideshare y delivery: alta frecuencia y línea rápida.',
    type: 'DRIVER', suggestedPrice: 1299, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR],
      segments: ['taxistas', 'rideshare', 'delivery'],
      limits: { maxPerPeriod: { count: 2, period: 'DAY' } },
      benefits: ['linea_rapida'], renewal: { auto: true },
      metrics: ['uso_promedio', 'rentabilidad_por_miembro', 'retencion'],
    },
  },
  {
    key: 'carwash.subscription_box',
    industry: 'carwash', name: 'Wash Box Mensual', tier: 'smart',
    description: 'Caja mensual: 4 lavados premium + producto de cuidado sorpresa.',
    type: 'SUBSCRIPTION_BOX', suggestedPrice: 1999, currency: 'DOP', periodicity: 'MONTHLY', credits: 4,
    config: {
      includedServices: [SERVICES.PREMIUM],
      benefits: ['producto_mensual', 'aromatizante', 'kit_interior'],
      automations: ['envio_caja_mensual'], renewal: { auto: true },
      metrics: ['retencion', 'ltv', 'uso_promedio'],
    },
  },

  // ── Variantes adicionales de modelos insignia (múltiples por modelo) ──
  {
    key: 'carwash.unlimited_wash_vacuum',
    industry: 'carwash', name: 'Unlimited Lavado + Aspirado', tier: 'basic',
    description: 'Exterior y aspirado ilimitados (máx. 1 por día).',
    type: 'UNLIMITED', suggestedPrice: 1199, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.ASPIRADO],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' }, minIntervalMinutes: 720 },
      renewal: { auto: true, graceDays: 5 }, metrics: ['uso_promedio', 'rentabilidad_por_miembro'],
    },
  },
  {
    key: 'carwash.unlimited_wash_wax',
    industry: 'carwash', name: 'Unlimited Lavado + Cera', tier: 'basic',
    description: 'Lavado premium con cera ilimitado.',
    type: 'UNLIMITED', suggestedPrice: 1699, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.PREMIUM],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' }, minIntervalMinutes: 720 },
      benefits: ['encerado_incluido'], renewal: { auto: true, graceDays: 5 },
      metrics: ['uso_promedio', 'visitas_promedio'],
    },
  },
  {
    key: 'carwash.unlimited_complete',
    industry: 'carwash', name: 'Unlimited Completo', tier: 'basic',
    description: 'Todos los servicios de lavado ilimitados.',
    type: 'UNLIMITED', suggestedPrice: 1899, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR, SERVICES.ASPIRADO, SERVICES.PREMIUM],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' }, minIntervalMinutes: 720 },
      renewal: { auto: true, graceDays: 5 }, metrics: ['uso_promedio', 'rentabilidad_por_miembro', 'retencion'],
    },
  },
  {
    key: 'carwash.unlimited_vip',
    industry: 'carwash', name: 'Unlimited VIP', tier: 'advanced',
    description: 'Ilimitado premium + detailing con línea rápida y prioridad.',
    type: 'UNLIMITED', suggestedPrice: 3499, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.PREMIUM, SERVICES.DETAILING],
      limits: { maxPerPeriod: { count: 1, period: 'DAY' } },
      benefits: ['linea_rapida', 'atencion_prioritaria'], renewal: { auto: true, graceDays: 5 },
      metrics: ['retencion', 'ltv', 'rentabilidad_por_miembro'],
    },
  },
  {
    key: 'carwash.credits_premium',
    industry: 'carwash', name: 'Wash Credits · Premium', tier: 'basic',
    description: '5 lavados premium al mes.',
    type: 'CREDITS', suggestedPrice: 1600, currency: 'DOP', periodicity: 'MONTHLY', credits: 5,
    config: {
      includedServices: [SERVICES.PREMIUM],
      limits: { maxCreditsRollover: 2, creditsTransferable: false }, renewal: { auto: true },
      metrics: ['uso_promedio', 'rentabilidad_por_miembro'],
    },
  },
  {
    key: 'carwash.credits_max',
    industry: 'carwash', name: 'Wash Credits · Max', tier: 'basic',
    description: '10 lavados al mes con acumulación amplia.',
    type: 'CREDITS', suggestedPrice: 1800, currency: 'DOP', periodicity: 'MONTHLY', credits: 10,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR],
      limits: { maxCreditsRollover: 5, creditsTransferable: true }, renewal: { auto: true },
      metrics: ['uso_promedio', 'cancelaciones'],
    },
  },
  {
    key: 'carwash.family_premium',
    industry: 'carwash', name: 'Family Premium', tier: 'advanced',
    description: 'Hasta 4 vehículos con lavados premium ilimitados.',
    type: 'FAMILY', suggestedPrice: 3500, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.PREMIUM, SERVICES.ASPIRADO],
      limits: { maxVehicles: 4, maxPerPeriod: { count: 2, period: 'DAY' } },
      renewal: { auto: true }, metrics: ['uso_promedio', 'visitas_promedio', 'retencion'],
    },
  },
  {
    key: 'carwash.fleet_small',
    industry: 'carwash', name: 'Fleet Small', tier: 'advanced',
    description: 'Flotas pequeñas (hasta 5 vehículos) con reporte mensual.',
    type: 'FLEET', suggestedPrice: 8000, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.EXTERIOR, SERVICES.INTERIOR],
      limits: { maxVehicles: 5 }, segments: ['empresas', 'dealers'],
      automations: ['reporte_mensual_flota'], metrics: ['uso_promedio', 'rentabilidad_por_miembro'],
    },
  },
  {
    key: 'carwash.premium_detailing',
    industry: 'carwash', name: 'Premium Detailing', tier: 'advanced',
    description: '4 detailing al mes + protección para vehículos de alta gama.',
    type: 'PREMIUM', suggestedPrice: 6999, currency: 'DOP', periodicity: 'MONTHLY', credits: 4,
    config: {
      includedServices: [SERVICES.DETAILING, SERVICES.PREMIUM], segments: ['lujo', 'ejecutivos'],
      vehicleTypes: ['lujo', 'suv'], benefits: ['proteccion_ceramica', 'linea_rapida'],
      metrics: ['rentabilidad_por_miembro', 'ltv'],
    },
  },
  {
    key: 'carwash.vip_platinum',
    industry: 'carwash', name: 'VIP Platinum', tier: 'advanced',
    description: 'Máxima experiencia: todo incluido, eventos y concierge.',
    type: 'VIP', suggestedPrice: 9999, currency: 'DOP', periodicity: 'MONTHLY', unlimited: true,
    config: {
      includedServices: [SERVICES.PREMIUM, SERVICES.DETAILING, SERVICES.INTERIOR, SERVICES.ASPIRADO],
      benefits: ['linea_rapida', 'atencion_prioritaria', 'regalos', 'eventos', 'concierge'],
      metrics: ['retencion', 'ltv'],
    },
  },
]

/** Índice por clave para instanciar rápido. */
const BY_KEY = new Map(CARWASH_MEMBERSHIP_TEMPLATES.map((t) => [t.key, t]))

export function getCarwashTemplate(key: string): MembershipTemplate | undefined {
  return BY_KEY.get(key)
}

/**
 * Cobertura de los 20 modelos comerciales agrupada por tipo. El `satisfies`
 * GARANTIZA en compilación que ningún `MembershipPlanType` quede fuera del mapa:
 * si se añade un modelo al enum sin registrarlo aquí, `tsc` falla. La biblioteca
 * provee ≥1 plantilla para cada tipo (cobertura completa de la Strategy Library).
 */
export const CARWASH_MEMBERSHIP_BY_TYPE = {
  UNLIMITED: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'UNLIMITED'),
  CREDITS: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'CREDITS'),
  HYBRID: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'HYBRID'),
  TIER: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'TIER'),
  FAMILY: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'FAMILY'),
  FLEET: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'FLEET'),
  CORPORATE: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'CORPORATE'),
  SEASONAL: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'SEASONAL'),
  PREMIUM: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'PREMIUM'),
  MAINTENANCE: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'MAINTENANCE'),
  PAY_PER_VISIT: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'PAY_PER_VISIT'),
  LOYALTY: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'LOYALTY'),
  PREPAID: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'PREPAID'),
  VIP: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'VIP'),
  REWARDS: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'REWARDS'),
  TRIAL: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'TRIAL'),
  STUDENT: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'STUDENT'),
  DRIVER: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'DRIVER'),
  SUBSCRIPTION_BOX: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'SUBSCRIPTION_BOX'),
  CUSTOM: CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.type === 'CUSTOM'),
} satisfies Record<MembershipPlanType, readonly MembershipTemplate[]>

/** Plantillas Car Wash de un modelo comercial. */
export function carwashMembershipByType(
  type: MembershipPlanType,
): readonly MembershipTemplate[] {
  return CARWASH_MEMBERSHIP_BY_TYPE[type]
}

/** Plantillas Car Wash de un nivel de despliegue (basic/advanced/smart). */
export function carwashMembershipByTier(
  tier: MembershipTemplate['tier'],
): readonly MembershipTemplate[] {
  return CARWASH_MEMBERSHIP_TEMPLATES.filter((t) => t.tier === tier)
}
