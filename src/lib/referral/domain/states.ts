/**
 * Flujo de estados del referido (Fase D). El recorrido es CONFIGURABLE: cada
 * empresa decide qué estados usa y en cuál se libera la recompensa. Aquí se
 * define el flujo canónico por defecto y las utilidades para avanzar.
 */

import type { ReferralConfig } from './types'

/** Estados canónicos del Documento Maestro 4 (flujo por defecto, en orden). */
export const REFERRAL_STATES = {
  INVITED: 'INVITED', // invitación enviada
  REGISTERED: 'REGISTERED', // registro completado
  VERIFIED: 'VERIFIED', // cuenta verificada
  FIRST_PURCHASE: 'FIRST_PURCHASE', // primera compra
  ACTIVE: 'ACTIVE', // cliente activo
  RECURRING: 'RECURRING', // cliente recurrente
  REWARDED: 'REWARDED', // recompensa liberada
} as const

export type ReferralStateKey = (typeof REFERRAL_STATES)[keyof typeof REFERRAL_STATES]

export interface ReferralStateDef {
  readonly id: ReferralStateKey
  readonly name: string
  readonly description: string
}

export const REFERRAL_STATE_CATALOG: readonly ReferralStateDef[] = [
  { id: REFERRAL_STATES.INVITED, name: 'Invitación enviada', description: 'El participante compartió su enlace.' },
  { id: REFERRAL_STATES.REGISTERED, name: 'Registro completado', description: 'El invitado creó su cuenta.' },
  { id: REFERRAL_STATES.VERIFIED, name: 'Cuenta verificada', description: 'El invitado confirmó su cuenta.' },
  { id: REFERRAL_STATES.FIRST_PURCHASE, name: 'Primera compra', description: 'El invitado realizó su primera compra.' },
  { id: REFERRAL_STATES.ACTIVE, name: 'Cliente activo', description: 'El invitado usa el servicio con regularidad.' },
  { id: REFERRAL_STATES.RECURRING, name: 'Cliente recurrente', description: 'El invitado compra de forma recurrente.' },
  { id: REFERRAL_STATES.REWARDED, name: 'Recompensa liberada', description: 'La recompensa fue entregada.' },
]

const DEFAULT_FLOW: readonly string[] = REFERRAL_STATE_CATALOG.map((s) => s.id)

/** Flujo efectivo de un programa (config.states o el canónico). */
export function programFlow(config: ReferralConfig): readonly string[] {
  const custom = config.states
  return custom && custom.length > 0 ? custom : DEFAULT_FLOW
}

/** Estado en el que se libera la recompensa (config.rewardState o FIRST_PURCHASE). */
export function rewardState(config: ReferralConfig): string {
  return config.rewardState ?? REFERRAL_STATES.FIRST_PURCHASE
}

/** Índice de un estado en el flujo (-1 si no pertenece). */
export function stateIndex(config: ReferralConfig, state: string): number {
  return programFlow(config).indexOf(state)
}

/** Siguiente estado del flujo, o null si `state` es el último/desconocido. */
export function nextState(config: ReferralConfig, state: string): string | null {
  const flow = programFlow(config)
  const i = flow.indexOf(state)
  if (i === -1 || i >= flow.length - 1) return null
  return flow[i + 1]
}

/**
 * ¿Se puede avanzar de `from` a `to`? Solo hacia adelante y sin saltos (un paso
 * a la vez) dentro del flujo configurado.
 */
export function canAdvance(config: ReferralConfig, from: string, to: string): boolean {
  const flow = programFlow(config)
  const a = flow.indexOf(from)
  const b = flow.indexOf(to)
  return a !== -1 && b !== -1 && b === a + 1
}

/** ¿El estado alcanza (o supera) el estado que libera la recompensa? */
export function reachesReward(config: ReferralConfig, state: string): boolean {
  const flow = programFlow(config)
  const target = flow.indexOf(rewardState(config))
  const cur = flow.indexOf(state)
  return target !== -1 && cur !== -1 && cur >= target
}
