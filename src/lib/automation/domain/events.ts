/**
 * Sistema de eventos del Automation Engine (Fase E1). Toda acción importante
 * genera un evento; otras automatizaciones lo consumen (encadenado). Catálogo
 * universal como DATOS — ninguna industria específica.
 */

export const AUTOMATION_EVENTS = {
  CLIENT_REGISTERED: 'cliente.registrado',
  CLIENT_VISIT: 'cliente.visita',
  CLIENT_RENEWED: 'cliente.renovo',
  CLIENT_CANCELLED: 'cliente.cancelo',
  CLIENT_LEVEL_UP: 'cliente.subio_nivel',
  CLIENT_REWARD_OBTAINED: 'cliente.obtuvo_recompensa',
  CLIENT_COUPON_USED: 'cliente.uso_cupon',
  CLIENT_STREAK_REACHED: 'cliente.alcanzo_racha',
  CLIENT_STREAK_LOST: 'cliente.perdio_racha',
  CLIENT_REFERRED_FRIEND: 'cliente.recomendo_amigo',
  CLIENT_MISSION_COMPLETED: 'cliente.completo_mision',
  CLIENT_PURCHASE: 'cliente.compro_servicio',
  // Ciclo de vida temprano (onboarding) — universales, ninguna industria.
  CLIENT_PROFILE_COMPLETED: 'cliente.completo_perfil',
  CLIENT_VERIFIED: 'cliente.verifico_cuenta',
  CLIENT_PREFERENCES_SET: 'cliente.configuro_preferencias',
  CLIENT_CONSENT_GIVEN: 'cliente.acepto_consentimiento',
  CLIENT_FIRST_VISIT: 'cliente.primera_visita',
  CLIENT_ONBOARDING_COMPLETED: 'cliente.completo_onboarding',
  // Emitidos por el propio motor.
  AUTOMATION_STARTED: 'automatizacion.iniciada',
  AUTOMATION_FINISHED: 'automatizacion.finalizada',
} as const

export type AutomationEventType =
  (typeof AUTOMATION_EVENTS)[keyof typeof AUTOMATION_EVENTS]

export interface AutomationEventDef {
  readonly id: string
  readonly name: string
  readonly description: string
}

export const AUTOMATION_EVENT_CATALOG: readonly AutomationEventDef[] = [
  { id: AUTOMATION_EVENTS.CLIENT_REGISTERED, name: 'Cliente registrado', description: 'Un cliente creó su cuenta.' },
  { id: AUTOMATION_EVENTS.CLIENT_VISIT, name: 'Cliente realizó visita', description: 'El cliente usó el servicio.' },
  { id: AUTOMATION_EVENTS.CLIENT_RENEWED, name: 'Cliente renovó', description: 'El cliente renovó su membresía.' },
  { id: AUTOMATION_EVENTS.CLIENT_CANCELLED, name: 'Cliente canceló', description: 'El cliente canceló su membresía.' },
  { id: AUTOMATION_EVENTS.CLIENT_LEVEL_UP, name: 'Cliente cambió de nivel', description: 'El cliente subió de nivel.' },
  { id: AUTOMATION_EVENTS.CLIENT_REWARD_OBTAINED, name: 'Cliente obtuvo recompensa', description: 'El cliente recibió una recompensa.' },
  { id: AUTOMATION_EVENTS.CLIENT_COUPON_USED, name: 'Cliente utilizó cupón', description: 'El cliente canjeó un cupón.' },
  { id: AUTOMATION_EVENTS.CLIENT_STREAK_REACHED, name: 'Cliente alcanzó una racha', description: 'El cliente logró una racha.' },
  { id: AUTOMATION_EVENTS.CLIENT_STREAK_LOST, name: 'Cliente perdió una racha', description: 'El cliente rompió su racha.' },
  { id: AUTOMATION_EVENTS.CLIENT_REFERRED_FRIEND, name: 'Cliente recomendó un amigo', description: 'El cliente refirió a alguien.' },
  { id: AUTOMATION_EVENTS.CLIENT_MISSION_COMPLETED, name: 'Cliente completó una misión', description: 'El cliente terminó una misión de gamificación.' },
  { id: AUTOMATION_EVENTS.CLIENT_PURCHASE, name: 'Cliente compró un servicio', description: 'El cliente adquirió un servicio.' },
  { id: AUTOMATION_EVENTS.CLIENT_PROFILE_COMPLETED, name: 'Cliente completó su perfil', description: 'El cliente terminó de completar la información de su perfil.' },
  { id: AUTOMATION_EVENTS.CLIENT_VERIFIED, name: 'Cliente verificó su cuenta', description: 'El cliente confirmó su cuenta (correo/teléfono).' },
  { id: AUTOMATION_EVENTS.CLIENT_PREFERENCES_SET, name: 'Cliente configuró preferencias', description: 'El cliente indicó sus preferencias (servicios, sucursal, horarios).' },
  { id: AUTOMATION_EVENTS.CLIENT_CONSENT_GIVEN, name: 'Cliente aceptó consentimiento', description: 'El cliente aceptó términos, políticas o preferencias de comunicación.' },
  { id: AUTOMATION_EVENTS.CLIENT_FIRST_VISIT, name: 'Cliente hizo su primera visita', description: 'El cliente realizó su primera visita/compra tras registrarse.' },
  { id: AUTOMATION_EVENTS.CLIENT_ONBOARDING_COMPLETED, name: 'Cliente completó el onboarding', description: 'El cliente terminó su proceso de activación inicial.' },
  { id: AUTOMATION_EVENTS.AUTOMATION_STARTED, name: 'Automatización iniciada', description: 'Comenzó una ejecución.' },
  { id: AUTOMATION_EVENTS.AUTOMATION_FINISHED, name: 'Automatización finalizada', description: 'Terminó una ejecución.' },
]
