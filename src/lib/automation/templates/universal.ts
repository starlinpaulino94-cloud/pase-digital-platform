/**
 * Plantillas UNIVERSALES base del Automation Engine (Fase E1). No son
 * específicas de Car Wash: usan variables, condiciones (Rule/BEL) y acciones
 * (Action Engine) genéricas. Sirven de fundación y demuestran el motor. Las
 * bibliotecas por objetivo (captación, onboarding, frecuencia, recuperación,
 * membresías, referidos, campañas, gamificación, IA) se añaden en E1.1–E1.10
 * sin duplicar lógica.
 *
 * Las acciones referencian tipos del Action Engine y beneficios del Benefit
 * Engine por código; los valores usan variables `{{...}}` — nunca fijos.
 */

import { ACTION_TYPES } from '@/lib/rule-engine'
import { AUTOMATION_EVENTS } from '../domain/events'
import type { AutomationTemplate } from './types'

export const UNIVERSAL_AUTOMATION_TEMPLATES: readonly AutomationTemplate[] = [
  // Cumpleaños → crear beneficio → notificar (encadenable con gamificación).
  {
    key: 'universal.cumpleanos',
    name: 'Beneficio de cumpleaños',
    description: 'Cuando es el cumpleaños del cliente, entrega un beneficio y lo notifica.',
    objective: 'retencion',
    category: 'fechas',
    config: {
      trigger: { type: 'DATE', params: { field: 'cliente.cumpleanos' } },
      variables: ['cliente.nombre', 'cliente.cumpleanos'],
      channels: ['push', 'whatsapp'],
      schedule: { hours: { from: '08:00', to: '20:00' } },
      limits: { maxPerSubject: 1, perPeriod: 'YEAR' },
      steps: [
        {
          label: 'Entregar beneficio y avisar',
          actions: [
            { type: ACTION_TYPES.APPLY_BENEFIT, params: { benefitCode: 'CAR-014', kind: 'discount' }, required: true },
            { type: ACTION_TYPES.SEND_PUSH, params: { title: '¡Feliz cumpleaños, {{cliente.nombre}}!', body: 'Tienes un regalo esperándote.' } },
          ],
          chain: { event: AUTOMATION_EVENTS.CLIENT_REWARD_OBTAINED },
        },
      ],
    },
  },

  // Recuperación: cliente inactivo → SI última visita > 30 días ENTONCES beneficio.
  {
    key: 'universal.recuperacion_inactivos',
    name: 'Recuperación de inactivos',
    description: 'Si el cliente lleva más de 30 días sin visitar, ofrece un beneficio de recuperación.',
    objective: 'recuperacion',
    category: 'recuperacion',
    config: {
      trigger: { type: 'SCHEDULE', schedule: '0 9 * * *' },
      variables: ['cliente.nombre', 'cliente.ultima_compra'],
      channels: ['whatsapp', 'email'],
      limits: { maxPerSubject: 1, perPeriod: 'MONTH' },
      steps: [
        {
          label: 'Evaluar inactividad',
          condition: 'cliente.diasSinVisita > 30',
          actions: [
            { type: ACTION_TYPES.APPLY_BENEFIT, params: { benefitCode: 'CAR-015', kind: 'discount' }, required: true },
            { type: ACTION_TYPES.SEND_WHATSAPP, params: { body: 'Te extrañamos, {{cliente.nombre}}. Vuelve con este beneficio.' } },
          ],
        },
      ],
    },
  },

  // Onboarding tras registro: notificar bienvenida → esperar → segunda acción.
  {
    key: 'universal.bienvenida',
    name: 'Bienvenida al registrarse',
    description: 'Cuando un cliente se registra, le da la bienvenida y programa un segundo mensaje.',
    objective: 'onboarding',
    category: 'onboarding',
    config: {
      trigger: { type: 'EVENT', event: AUTOMATION_EVENTS.CLIENT_REGISTERED },
      variables: ['cliente.nombre'],
      channels: ['push', 'email'],
      steps: [
        {
          label: 'Dar bienvenida',
          actions: [
            { type: ACTION_TYPES.SEND_PUSH, params: { title: '¡Bienvenido, {{cliente.nombre}}!', body: 'Gracias por unirte.' } },
          ],
          wait: { ms: 86_400_000 }, // 24h
        },
        {
          label: 'Invitar a la primera visita',
          actions: [
            { type: ACTION_TYPES.SEND_EMAIL, params: { subject: 'Tu primer beneficio te espera' } },
          ],
        },
      ],
    },
  },

  // Gamificación: uso de beneficio → otorgar puntos (encadenable a subir nivel).
  {
    key: 'universal.puntos_por_uso',
    name: 'Puntos por usar un beneficio',
    description: 'Cuando el cliente utiliza un cupón/beneficio, le otorga puntos.',
    objective: 'gamificacion',
    category: 'gamificacion',
    config: {
      trigger: { type: 'EVENT', event: AUTOMATION_EVENTS.CLIENT_COUPON_USED },
      variables: ['cliente.puntos'],
      steps: [
        {
          label: 'Otorgar puntos',
          actions: [
            { type: ACTION_TYPES.ADD_POINTS, params: { points: 50 }, required: true },
          ],
          chain: { event: AUTOMATION_EVENTS.CLIENT_MISSION_COMPLETED },
        },
      ],
    },
  },
]

/** Busca una plantilla universal por su key. */
export function getUniversalAutomation(key: string): AutomationTemplate | undefined {
  return UNIVERSAL_AUTOMATION_TEMPLATES.find((t) => t.key === key)
}
