/**
 * Plantillas de transformación para la industria Car Wash.
 *
 * Cada plantilla es una política preconfigurada que la empresa puede instalar
 * y personalizar. Ninguna contiene lógica de código: son datos editables.
 */

import type { TransformationPolicyTemplate } from './types'

export const CARWASH_TRANSFORMATION_TEMPLATES: readonly TransformationPolicyTemplate[] = [
  // ── Upgrades ───────────────────────────────────────────────────────────
  {
    key: 'CW-TRF-001',
    name: 'Upgrade de lavado (pago de diferencia)',
    description: 'Permite mejorar un lavado básico a premium pagando la diferencia. Disponible en todas las sucursales durante horario comercial.',
    industry: 'carwash',
    type: 'UPGRADE',
    config: {
      funding: {
        allowPayment: true,
        allowPoints: true,
        allowCredits: true,
        allowCoupons: true,
        allowPromotions: true,
        allowCombinedMethods: true,
      },
      requiresApproval: false,
      requiresPayment: true,
      updatesQr: true,
      replacesOriginal: true,
      createsNewGrant: true,
      keepsBothGrants: false,
    },
    tags: ['upgrade', 'pago-diferencia', 'lavado'],
  },
  {
    key: 'CW-TRF-002',
    name: 'Upgrade de lavado con puntos',
    description: 'Mejora de servicio usando únicamente puntos acumulados. Sin pago adicional.',
    industry: 'carwash',
    type: 'UPGRADE',
    config: {
      funding: {
        allowPayment: false,
        allowPoints: true,
        allowCredits: false,
        allowCoupons: false,
        allowPromotions: false,
        allowCombinedMethods: false,
      },
      requiresApproval: false,
      requiresPayment: false,
      updatesQr: true,
      replacesOriginal: true,
      createsNewGrant: true,
      keepsBothGrants: false,
    },
    tags: ['upgrade', 'puntos', 'lavado'],
  },
  {
    key: 'CW-TRF-003',
    name: 'Upgrade VIP automático',
    description: 'Mejora automática para miembros VIP: lavado básico a premium sin costo adicional.',
    industry: 'carwash',
    type: 'UPGRADE',
    config: {
      allowedPlans: [],
      funding: {
        allowPayment: false,
        allowPoints: false,
        allowCredits: false,
        allowCoupons: false,
        allowPromotions: false,
        allowCombinedMethods: false,
      },
      requiresApproval: false,
      requiresPayment: false,
      updatesQr: true,
      replacesOriginal: true,
      createsNewGrant: true,
      keepsBothGrants: false,
    },
    tags: ['upgrade', 'vip', 'automatico'],
  },

  // ── Downgrades ─────────────────────────────────────────────────────────
  {
    key: 'CW-TRF-004',
    name: 'Downgrade de lavado (crédito a favor)',
    description: 'Permite cambiar un servicio premium por uno básico, generando crédito a favor para la próxima visita.',
    industry: 'carwash',
    type: 'DOWNGRADE',
    config: {
      funding: {
        allowPayment: false,
        allowPoints: false,
        allowCredits: true,
        allowCoupons: false,
        allowPromotions: false,
        allowCombinedMethods: false,
      },
      requiresApproval: false,
      requiresPayment: false,
      updatesQr: true,
      replacesOriginal: true,
      createsNewGrant: true,
      keepsBothGrants: false,
    },
    tags: ['downgrade', 'credito', 'lavado'],
  },

  // ── Exchanges ──────────────────────────────────────────────────────────
  {
    key: 'CW-TRF-005',
    name: 'Intercambio de servicio',
    description: 'Permite cambiar un lavado premium por un lavado básico más aspirado interior, pagando diferencia si aplica.',
    industry: 'carwash',
    type: 'EXCHANGE',
    config: {
      funding: {
        allowPayment: true,
        allowPoints: true,
        allowCredits: true,
        allowCoupons: true,
        allowPromotions: true,
        allowCombinedMethods: true,
      },
      requiresApproval: false,
      requiresPayment: true,
      updatesQr: true,
      replacesOriginal: true,
      createsNewGrant: true,
      keepsBothGrants: false,
    },
    tags: ['intercambio', 'combo', 'lavado'],
  },

  // ── Replacements ───────────────────────────────────────────────────────
  {
    key: 'CW-TRF-006',
    name: 'Reemplazo autorizado por gerente',
    description: 'El gerente puede reemplazar cualquier beneficio por otro de igual o menor valor sin costo para el cliente.',
    industry: 'carwash',
    type: 'REPLACEMENT',
    config: {
      funding: {
        allowPayment: false,
        allowPoints: false,
        allowCredits: false,
        allowCoupons: false,
        allowPromotions: false,
        allowCombinedMethods: false,
      },
      requiresApproval: true,
      requiresPayment: false,
      updatesQr: true,
      replacesOriginal: true,
      createsNewGrant: true,
      keepsBothGrants: false,
    },
    tags: ['reemplazo', 'gerente', 'autorizacion'],
  },

  // ── Customizations ─────────────────────────────────────────────────────
  {
    key: 'CW-TRF-007',
    name: 'Personalización de lavado (add-ons)',
    description: 'Permite agregar servicios adicionales (cera, aromatizante, motor) al lavado incluido en la membresía, pagando el extra.',
    industry: 'carwash',
    type: 'CUSTOMIZATION',
    config: {
      funding: {
        allowPayment: true,
        allowPoints: true,
        allowCredits: true,
        allowCoupons: true,
        allowPromotions: true,
        allowCombinedMethods: true,
      },
      requiresApproval: false,
      requiresPayment: true,
      updatesQr: true,
      replacesOriginal: false,
      createsNewGrant: false,
      keepsBothGrants: true,
    },
    tags: ['personalizacion', 'addon', 'lavado'],
  },
  {
    key: 'CW-TRF-008',
    name: 'Upgrade de combo por cumpleaños',
    description: 'En el mes de cumpleaños, mejora automática de combo clásico a ejecutivo sin costo.',
    industry: 'carwash',
    type: 'UPGRADE',
    config: {
      funding: {
        allowPayment: false,
        allowPoints: false,
        allowCredits: false,
        allowCoupons: false,
        allowPromotions: false,
        allowCombinedMethods: false,
      },
      limits: { maxPerMonth: 1, maxPerMembership: 1 },
      requiresApproval: false,
      requiresPayment: false,
      updatesQr: true,
      replacesOriginal: true,
      createsNewGrant: true,
      keepsBothGrants: false,
    },
    tags: ['upgrade', 'cumpleanos', 'combo'],
  },
  {
    key: 'CW-TRF-009',
    name: 'Intercambio de créditos por servicio',
    description: 'Permite usar créditos de membresía para obtener un servicio diferente al incluido (ej: usar 2 lavados básicos para un detailing).',
    industry: 'carwash',
    type: 'EXCHANGE',
    config: {
      funding: {
        allowPayment: true,
        allowPoints: false,
        allowCredits: true,
        allowCoupons: false,
        allowPromotions: false,
        allowCombinedMethods: true,
      },
      requiresApproval: false,
      requiresPayment: true,
      updatesQr: true,
      replacesOriginal: true,
      createsNewGrant: true,
      keepsBothGrants: false,
    },
    tags: ['intercambio', 'creditos', 'detailing'],
  },
  {
    key: 'CW-TRF-010',
    name: 'Downgrade temporal por mantenimiento',
    description: 'Cuando un servicio premium no está disponible (equipo en mantenimiento), ofrecer servicio alternativo de menor costo con crédito a favor.',
    industry: 'carwash',
    type: 'DOWNGRADE',
    config: {
      funding: {
        allowPayment: false,
        allowPoints: false,
        allowCredits: true,
        allowCoupons: false,
        allowPromotions: false,
        allowCombinedMethods: false,
      },
      requiresApproval: false,
      requiresPayment: false,
      updatesQr: true,
      replacesOriginal: true,
      createsNewGrant: true,
      keepsBothGrants: false,
    },
    tags: ['downgrade', 'mantenimiento', 'temporal'],
  },
] as const

export function getCarwashTransformationTemplate(key: string): TransformationPolicyTemplate | undefined {
  return CARWASH_TRANSFORMATION_TEMPLATES.find(t => t.key === key)
}

export function listCarwashTransformationTemplates(
  type?: string,
): readonly TransformationPolicyTemplate[] {
  if (!type) return CARWASH_TRANSFORMATION_TEMPLATES
  return CARWASH_TRANSFORMATION_TEMPLATES.filter(t => t.type === type)
}
