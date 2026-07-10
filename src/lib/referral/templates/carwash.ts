/**
 * Biblioteca de plantillas de PROGRAMA DE REFERIDOS para CAR WASH (Fase D,
 * Industria 1). Los programas iniciales del Documento Maestro 4 como DATOS.
 * Las recompensas referencian beneficios del Benefit Engine (Fase C) por código
 * (CAR-0xx); el motor no contiene nada de Car Wash. Un Car Wash instancia los
 * que necesite y los edita.
 */

import { REFERRAL_CONDITIONS as COND } from '../domain/conditions'
import { DEFAULT_FRAUD_RULES } from '../domain/fraud'
import { REFERRAL_STATES as ST } from '../domain/states'
import type { ReferralProgramTemplate } from './types'

function p(
  t: Omit<ReferralProgramTemplate, 'key' | 'industry'>,
): ReferralProgramTemplate {
  return { ...t, industry: 'carwash', key: `carwash.${t.category}.${slug(t.name)}` }
}
function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

// Enlaces habilitados por defecto y estado que libera la recompensa.
const LINKS = ['CODE', 'QR', 'LINK'] as const
const REWARD_ON_FIRST_PURCHASE = { rewardState: ST.FIRST_PURCHASE }
const FIRST_PURCHASE_COND = [{ type: COND.FIRST_PURCHASE }, { type: COND.PAYMENT_CONFIRMED }]

export const CARWASH_REFERRAL_TEMPLATES: readonly ReferralProgramTemplate[] = [
  // ── Captación ──
  p({
    name: 'Invita un amigo', objective: 'captacion', type: 'REFERRER_ONLY', category: 'captacion',
    description: 'El cliente recibe un lavado gratis cuando su invitado hace su primera compra.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: [...LINKS], conditions: FIRST_PURCHASE_COND,
      rewards: [{ target: 'REFERRER', benefitCode: 'CAR-001', label: 'Lavado gratis' }],
      fraud: DEFAULT_FRAUD_RULES,
    },
  }),
  p({
    name: 'Ambos ganan', objective: 'captacion', type: 'BOTH', category: 'captacion',
    description: 'El cliente recibe lavado gratis y el nuevo cliente 20% de descuento en su primera visita.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: [...LINKS], conditions: FIRST_PURCHASE_COND,
      rewards: [
        { target: 'REFERRER', benefitCode: 'CAR-001', label: 'Lavado gratis' },
        { target: 'REFERRED', benefitCode: 'CAR-011', label: '20% de descuento' },
      ],
      fraud: DEFAULT_FRAUD_RULES,
    },
  }),
  p({
    name: 'Primera visita', objective: 'captacion', type: 'REFERRED_ONLY', category: 'captacion',
    description: 'El nuevo cliente recibe un beneficio de bienvenida en su primera visita.',
    config: {
      rewardState: ST.REGISTERED, linkTypes: [...LINKS],
      rewards: [{ target: 'REFERRED', benefitCode: 'CAR-004', label: 'Aroma premium gratis' }],
      fraud: DEFAULT_FRAUD_RULES,
    },
  }),

  // ── Escalonadas (Modelo 5, progresivo) ──
  p({
    name: 'Recompensa progresiva', objective: 'retencion', type: 'PROGRESSIVE', category: 'escalonadas',
    description: 'Mientras más referidos consigue el cliente, mejores recompensas recibe.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: [...LINKS], conditions: FIRST_PURCHASE_COND,
      fraud: DEFAULT_FRAUD_RULES,
      tiers: [
        { threshold: 1, label: 'Nivel 1', reward: { target: 'REFERRER', benefitCode: 'CAR-004', label: 'Aroma gratis' } },
        { threshold: 3, label: 'Nivel 2', reward: { target: 'REFERRER', benefitCode: 'CAR-001', label: 'Lavado básico' } },
        { threshold: 5, label: 'Nivel 3', reward: { target: 'REFERRER', benefitCode: 'CAR-002', label: 'Lavado Premium' } },
        { threshold: 10, label: 'Silver', reward: { target: 'REFERRER', benefitCode: 'CAR-027', label: 'Membresía (mes gratis)' } },
        { threshold: 25, label: 'Gold', reward: { target: 'REFERRER', benefitCode: 'CAR-009', label: 'Detailing parcial' } },
      ],
    },
  }),

  // ── VIP ──
  p({
    name: 'Embajador', objective: 'alcance', type: 'AMBASSADOR', category: 'vip',
    description: 'Clientes con excelente historial reciben beneficios permanentes y exclusivos.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: [...LINKS], segments: ['embajador'],
      conditions: [{ type: COND.ACTIVE_CLIENT }, { type: COND.FIRST_PURCHASE }],
      fraud: DEFAULT_FRAUD_RULES,
      tiers: [
        { threshold: 10, label: 'Embajador', reward: { target: 'REFERRER', benefitCode: 'CAR-039', label: 'Crédito embajador' } },
        { threshold: 50, label: 'Embajador VIP', reward: { target: 'REFERRER', benefitCode: 'CAR-035', label: 'Eventos privados' } },
      ],
    },
  }),
  p({
    name: 'Cliente Oro', objective: 'retencion', type: 'AMBASSADOR', category: 'vip',
    description: 'Programa para los mejores clientes, con beneficios VIP crecientes.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: [...LINKS], segments: ['vip', 'alto_valor'],
      conditions: FIRST_PURCHASE_COND, fraud: DEFAULT_FRAUD_RULES,
      rewards: [{ target: 'BOTH', benefitCode: 'CAR-002', label: 'Lavado Premium' }],
    },
  }),
  p({
    name: 'Influencer', objective: 'alcance', type: 'INFLUENCER', category: 'vip',
    description: 'Genera alcance sin requerir compras frecuentes; conversiones mínimas definidas.',
    config: {
      rewardState: ST.REGISTERED, linkTypes: [...LINKS], segments: ['influencer'],
      rewards: [{ target: 'REFERRER', benefitCode: 'CAR-020', label: 'Crédito interno' }],
      fraud: { ...DEFAULT_FRAUD_RULES, requireRealPurchase: false },
      limits: { maxRewards: 100 },
    },
  }),

  // ── Empresas ──
  p({
    name: 'Convenios empresariales', objective: 'corporativo', type: 'CORPORATE', category: 'empresas',
    description: 'Una empresa recomienda a otra (dealers, rentadoras, transporte).',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: ['CODE', 'MANUAL'], segments: ['empresa'],
      conditions: [{ type: COND.MIN_PURCHASES, value: 5 }, { type: COND.PAYMENT_CONFIRMED }],
      rewards: [{ target: 'REFERRER', benefitCode: 'CAR-020', label: 'Crédito por convenio' }],
      fraud: { ...DEFAULT_FRAUD_RULES, blockSelfReferral: true },
    },
  }),
  p({
    name: 'Flotas', objective: 'corporativo', type: 'CORPORATE', category: 'empresas',
    description: 'Beneficios por referir flotas de vehículos.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: ['CODE', 'MANUAL'], segments: ['empresa'],
      conditions: [{ type: COND.MIN_AMOUNT, value: 5000 }, { type: COND.PAYMENT_CONFIRMED }],
      rewards: [{ target: 'REFERRER', benefitCode: 'CAR-022', label: 'Cashback de flota' }],
      fraud: DEFAULT_FRAUD_RULES,
    },
  }),
  p({
    name: 'Socios comerciales', objective: 'corporativo', type: 'CORPORATE', category: 'empresas',
    description: 'Programa de socios que recomiendan el servicio a sus clientes.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: ['CODE', 'LINK'], segments: ['empresa'],
      conditions: FIRST_PURCHASE_COND,
      rewards: [{ target: 'REFERRER', benefitCode: 'CAR-020', label: 'Comisión en crédito' }],
      fraud: DEFAULT_FRAUD_RULES,
    },
  }),

  // ── Campañas temporales ──
  p({
    name: 'Referidos dobles', objective: 'campana', type: 'BOTH', category: 'campanas',
    description: 'Durante la campaña, ambos reciben el doble de recompensa.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: [...LINKS], conditions: FIRST_PURCHASE_COND,
      rewards: [
        { target: 'REFERRER', benefitCode: 'CAR-002', label: 'Lavado Premium' },
        { target: 'REFERRED', benefitCode: 'CAR-001', label: 'Lavado gratis' },
      ],
      fraud: DEFAULT_FRAUD_RULES, limits: { maxPerMonth: 20 },
    },
  }),
  p({
    name: 'Semana del referido', objective: 'campana', type: 'BOTH', category: 'campanas',
    description: 'Campaña de una semana con recompensa inmediata al registrarse.',
    config: {
      rewardState: ST.REGISTERED, linkTypes: [...LINKS],
      rewards: [{ target: 'BOTH', benefitCode: 'CAR-004', label: 'Aroma premium' }],
      fraud: DEFAULT_FRAUD_RULES,
    },
  }),
  p({
    name: 'Black Friday', objective: 'campana', type: 'BOTH', category: 'campanas',
    description: 'Beneficios reforzados por referir durante Black Friday.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: [...LINKS], conditions: FIRST_PURCHASE_COND,
      rewards: [{ target: 'BOTH', benefitCode: 'CAR-011', label: '20% de descuento' }],
      fraud: DEFAULT_FRAUD_RULES,
    },
  }),
  p({
    name: 'Navidad', objective: 'campana', type: 'BOTH', category: 'campanas',
    description: 'Campaña navideña de referidos con regalo para ambos.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: [...LINKS], conditions: FIRST_PURCHASE_COND,
      rewards: [{ target: 'BOTH', benefitCode: 'CAR-006', label: 'Cera gratis' }],
      fraud: DEFAULT_FRAUD_RULES,
    },
  }),
  p({
    name: 'Aniversario', objective: 'campana', type: 'PROGRESSIVE', category: 'campanas',
    description: 'Campaña de aniversario con recompensas escalonadas.',
    config: {
      ...REWARD_ON_FIRST_PURCHASE, linkTypes: [...LINKS], conditions: FIRST_PURCHASE_COND,
      fraud: DEFAULT_FRAUD_RULES,
      tiers: [
        { threshold: 1, reward: { target: 'REFERRER', benefitCode: 'CAR-004', label: 'Aroma' } },
        { threshold: 5, reward: { target: 'REFERRER', benefitCode: 'CAR-002', label: 'Premium' } },
      ],
    },
  }),
]

/** Busca una plantilla de programa por su key. */
export function getCarwashReferralProgram(key: string): ReferralProgramTemplate | undefined {
  return CARWASH_REFERRAL_TEMPLATES.find((t) => t.key === key)
}

/** Plantillas agrupadas por categoría (para la UI de arranque). */
export function carwashReferralByCategory(): Record<string, readonly ReferralProgramTemplate[]> {
  const out: Record<string, ReferralProgramTemplate[]> = {}
  for (const t of CARWASH_REFERRAL_TEMPLATES) {
    ;(out[t.category] ??= []).push(t)
  }
  return out
}
