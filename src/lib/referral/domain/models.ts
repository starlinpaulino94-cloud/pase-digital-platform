/**
 * Taxonomía del Referral Engine (Fase D): los 10 modelos de programa, tipos de
 * enlace y segmentos. Todo como DATOS para que la UI y las plantillas los lean
 * sin lógica embebida.
 */

import type { ReferralLinkType, ReferralModel, RewardTarget } from './types'

export interface ReferralModelDef {
  readonly id: ReferralModel
  readonly name: string
  readonly description: string
  /** A quién recompensa por defecto este modelo. */
  readonly defaultTarget: RewardTarget
  /** ¿Usa escalado progresivo por defecto? */
  readonly progressive: boolean
}

/** Los 10 modelos del Documento Maestro 4. */
export const REFERRAL_MODEL_CATALOG: readonly ReferralModelDef[] = [
  { id: 'CLASSIC', name: 'Referido clásico', description: 'El amigo cumple la acción y ambos reciben recompensa. Ideal para negocios pequeños.', defaultTarget: 'BOTH', progressive: false },
  { id: 'REFERRER_ONLY', name: 'Solo gana quien invita', description: 'El cliente recibe el beneficio cuando el invitado cumple la condición.', defaultTarget: 'REFERRER', progressive: false },
  { id: 'REFERRED_ONLY', name: 'Solo gana el nuevo cliente', description: 'Ideal para campañas de captación.', defaultTarget: 'REFERRED', progressive: false },
  { id: 'BOTH', name: 'Ambos ganan', description: 'El modelo más usado. Ej.: cliente actual lavado gratis, nuevo cliente 20% descuento.', defaultTarget: 'BOTH', progressive: false },
  { id: 'PROGRESSIVE', name: 'Recompensa progresiva', description: 'Mientras más referidos consigue, mejores beneficios recibe (escalonado).', defaultTarget: 'REFERRER', progressive: true },
  { id: 'AMBASSADOR', name: 'Programa de embajadores', description: 'Clientes con excelente historial reciben beneficios permanentes, eventos VIP y comisiones.', defaultTarget: 'REFERRER', progressive: true },
  { id: 'INFLUENCER', name: 'Programa de influencers', description: 'Alcance sin requerir compras frecuentes; la empresa define conversiones mínimas.', defaultTarget: 'REFERRER', progressive: false },
  { id: 'CORPORATE', name: 'Referidos corporativos', description: 'Una empresa recomienda a otra. Ideal para dealers, rentadoras, transporte.', defaultTarget: 'REFERRER', progressive: false },
  { id: 'EMPLOYEE', name: 'Programa para empleados', description: 'Cada empleado genera clientes nuevos; recompensas por bonos, comisiones o reconocimientos.', defaultTarget: 'REFERRER', progressive: false },
  { id: 'TEAM', name: 'Programa por equipos', description: 'Sucursales o equipos compiten; el que más referidos consigue gana beneficios.', defaultTarget: 'REFERRER', progressive: true },
]

const MODEL_BY_ID = new Map(REFERRAL_MODEL_CATALOG.map((m) => [m.id, m]))
export function referralModel(id: ReferralModel): ReferralModelDef | undefined {
  return MODEL_BY_ID.get(id)
}

export interface ReferralLinkTypeDef {
  readonly id: ReferralLinkType
  readonly name: string
  readonly description: string
}

export const REFERRAL_LINK_TYPES: readonly ReferralLinkTypeDef[] = [
  { id: 'CODE', name: 'Código único', description: 'Un código alfanumérico por participante.' },
  { id: 'QR', name: 'Código QR', description: 'QR que resuelve al enlace del participante.' },
  { id: 'LINK', name: 'Enlace personalizado', description: 'URL con el código del participante.' },
  { id: 'MANUAL', name: 'Código manual', description: 'El empleado ingresa el código al registrar al referido.' },
]

/** Segmentos para campañas de referidos diferenciadas. */
export const REFERRAL_SEGMENTS = {
  NEW: 'nuevo',
  FREQUENT: 'frecuente',
  VIP: 'vip',
  MEMBER: 'miembro',
  AMBASSADOR: 'embajador',
  COMPANY: 'empresa',
  INFLUENCER: 'influencer',
  ALL: 'todos',
} as const

export type ReferralSegmentKey =
  (typeof REFERRAL_SEGMENTS)[keyof typeof REFERRAL_SEGMENTS]
