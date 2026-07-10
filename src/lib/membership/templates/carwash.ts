/**
 * Biblioteca de plantillas de membresía para CAR WASH (Fase A, Industria 1).
 *
 * Datos, no código: cada modelo comercial de la Strategy Library se expresa como
 * una MembershipTemplate configurable. Un Car Wash instancia las que necesite y
 * ajusta precios/límites. El motor no contiene nada específico de Car Wash: toda
 * la especificidad vive aquí, como configuración.
 */

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
]

/** Índice por clave para instanciar rápido. */
const BY_KEY = new Map(CARWASH_MEMBERSHIP_TEMPLATES.map((t) => [t.key, t]))

export function getCarwashTemplate(key: string): MembershipTemplate | undefined {
  return BY_KEY.get(key)
}
