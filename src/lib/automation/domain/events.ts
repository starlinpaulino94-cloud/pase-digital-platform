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
  // Conversión / primera compra — universales, ninguna industria.
  CLIENT_FIRST_PURCHASE: 'cliente.primera_compra',
  CLIENT_HIGH_VALUE_PURCHASE: 'cliente.compra_alto_valor',
  CLIENT_PROCESS_ABANDONED: 'cliente.proceso_abandonado',
  CLIENT_FEEDBACK_GIVEN: 'cliente.dio_feedback',
  CLIENT_LOYALTY_ENROLLED: 'cliente.inscrito_fidelizacion',
  // Frecuencia / comportamiento — universales, ninguna industria.
  CLIENT_FREQUENCY_DROP: 'cliente.bajo_frecuencia',
  CLIENT_FREQUENCY_UP: 'cliente.subio_frecuencia',
  CLIENT_FREQUENCY_GOAL: 'cliente.alcanzo_meta_frecuencia',
  CLIENT_HIGH_ACTIVITY: 'cliente.alta_actividad',
  CLIENT_BEHAVIOR_CHANGED: 'cliente.cambio_comportamiento',
  CLIENT_BENEFIT_UNDERUSED: 'cliente.no_usa_beneficios',
  CLIENT_CHURN_RISK: 'cliente.riesgo_abandono',
  // Recuperación / retención — universales, ninguna industria.
  CLIENT_RISK_LEVEL_CHANGED: 'cliente.cambio_nivel_riesgo',
  CLIENT_INACTIVE: 'cliente.inactivo',
  CLIENT_RECOVERED: 'cliente.recuperado',
  CLIENT_CAMPAIGN_IGNORED: 'cliente.ignoro_campana',
  MEMBERSHIP_EXPIRED: 'membresia.vencida',
  BENEFIT_EXPIRING: 'beneficio.por_vencer',
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
  { id: AUTOMATION_EVENTS.CLIENT_FIRST_PURCHASE, name: 'Cliente hizo su primera compra', description: 'El cliente completó su primera compra/consumo.' },
  { id: AUTOMATION_EVENTS.CLIENT_HIGH_VALUE_PURCHASE, name: 'Cliente hizo una compra de alto valor', description: 'El cliente realizó una compra por encima del promedio.' },
  { id: AUTOMATION_EVENTS.CLIENT_PROCESS_ABANDONED, name: 'Cliente abandonó un proceso', description: 'El cliente inició un proceso de compra/membresía y no lo completó.' },
  { id: AUTOMATION_EVENTS.CLIENT_FEEDBACK_GIVEN, name: 'Cliente dejó retroalimentación', description: 'El cliente respondió una encuesta o dejó feedback.' },
  { id: AUTOMATION_EVENTS.CLIENT_LOYALTY_ENROLLED, name: 'Cliente inscrito en fidelización', description: 'El cliente entró a un programa de fidelización.' },
  { id: AUTOMATION_EVENTS.CLIENT_FREQUENCY_DROP, name: 'Cliente bajó su frecuencia', description: 'El tiempo entre visitas/compras del cliente aumentó.' },
  { id: AUTOMATION_EVENTS.CLIENT_FREQUENCY_UP, name: 'Cliente subió su frecuencia', description: 'El cliente superó su frecuencia habitual.' },
  { id: AUTOMATION_EVENTS.CLIENT_FREQUENCY_GOAL, name: 'Cliente alcanzó meta de frecuencia', description: 'El cliente llegó a un objetivo de visitas/compras.' },
  { id: AUTOMATION_EVENTS.CLIENT_HIGH_ACTIVITY, name: 'Cliente con alta actividad', description: 'El cliente concentró varias visitas en poco tiempo.' },
  { id: AUTOMATION_EVENTS.CLIENT_BEHAVIOR_CHANGED, name: 'Cliente cambió su comportamiento', description: 'Cambió el patrón de horario, sucursal o gasto del cliente.' },
  { id: AUTOMATION_EVENTS.CLIENT_BENEFIT_UNDERUSED, name: 'Cliente no aprovecha beneficios', description: 'El cliente usa poco los beneficios disponibles.' },
  { id: AUTOMATION_EVENTS.CLIENT_CHURN_RISK, name: 'Cliente en riesgo de abandono', description: 'El comportamiento del cliente sugiere riesgo de abandono.' },
  { id: AUTOMATION_EVENTS.CLIENT_RISK_LEVEL_CHANGED, name: 'Cliente cambió de nivel de riesgo', description: 'El cliente pasó a otro estado del framework de recuperación.' },
  { id: AUTOMATION_EVENTS.CLIENT_INACTIVE, name: 'Cliente inactivo', description: 'El cliente no compra/visita desde el período configurado.' },
  { id: AUTOMATION_EVENTS.CLIENT_RECOVERED, name: 'Cliente recuperado', description: 'Un cliente en riesgo/inactivo volvió a estar activo.' },
  { id: AUTOMATION_EVENTS.CLIENT_CAMPAIGN_IGNORED, name: 'Cliente ignoró una campaña', description: 'El cliente no interactuó con una campaña dirigida.' },
  { id: AUTOMATION_EVENTS.MEMBERSHIP_EXPIRED, name: 'Membresía vencida', description: 'La membresía/suscripción del cliente expiró.' },
  { id: AUTOMATION_EVENTS.BENEFIT_EXPIRING, name: 'Beneficio por vencer', description: 'Un beneficio del cliente está próximo a expirar.' },
  { id: AUTOMATION_EVENTS.AUTOMATION_STARTED, name: 'Automatización iniciada', description: 'Comenzó una ejecución.' },
  { id: AUTOMATION_EVENTS.AUTOMATION_FINISHED, name: 'Automatización finalizada', description: 'Terminó una ejecución.' },
]
