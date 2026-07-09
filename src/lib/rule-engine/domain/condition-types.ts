/**
 * Condition Engine: registro extensible de TIPOS DE CONDICIÓN (Fase 2).
 *
 * Un ConditionType sabe RESOLVER el valor real que se va a comparar, a partir
 * del contexto y de la propia condición. Es el punto de extensión Open/Closed
 * del lenguaje: añadir "fecha", "hora", "cliente", "membresía", "compra", "qr"…
 * = registrar un nuevo ConditionType, SIN tocar el evaluador ni el motor.
 *
 * El tipo por defecto es `field`: resuelve un dot-path del contexto (idéntico al
 * comportamiento de Fase 1). Los demás tipos incluidos son ejemplos que
 * demuestran cómo enchufar nuevas fuentes de datos.
 */

import { resolveField, type RuleContext } from './context'
import type { DataType } from './data-types'
import { DuplicateRegistrationError } from './errors'
import type { RuleCondition } from './types'

export interface ConditionResolutionInput {
  readonly condition: RuleCondition
  readonly context: RuleContext
}

export interface ConditionType {
  /** Clave única enlazada con RuleCondition.conditionType. */
  readonly id: string
  readonly description: string
  /** Tipo de dato que produce, si es fijo (ej. DATE). Si no, lo aporta la condición. */
  readonly dataType?: DataType
  /** Resuelve el valor real a comparar desde el contexto. Nunca debe lanzar. */
  resolve(input: ConditionResolutionInput): unknown
  /** Valida la configuración de la condición. Devuelve mensaje de error o null. */
  validate?(condition: RuleCondition): string | null
}

/** Registro extensible de tipos de condición (mismo patrón que operadores). */
export class ConditionTypeRegistry {
  private readonly types = new Map<string, ConditionType>()

  register(type: ConditionType): this {
    if (this.types.has(type.id)) {
      throw new DuplicateRegistrationError('acción', type.id)
    }
    this.types.set(type.id, type)
    return this
  }

  has(id: string): boolean {
    return this.types.has(id)
  }

  /** No lanza: devuelve undefined si no existe (para el evaluador never-throw). */
  tryGet(id: string): ConditionType | undefined {
    return this.types.get(id)
  }

  list(): ConditionType[] {
    return [...this.types.values()]
  }
}

/** Minutos transcurridos desde medianoche (para comparaciones de tipo TIME). */
function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

/**
 * Crea el registro con los tipos de condición estándar. `field` es el esencial;
 * el resto son ejemplos de extensión que leen datos del contexto de forma
 * genérica (sin conocer negocio).
 */
export function createDefaultConditionTypeRegistry(): ConditionTypeRegistry {
  const registry = new ConditionTypeRegistry()

  const defaults: ConditionType[] = [
    {
      id: 'field',
      description: 'Resuelve un dot-path del contexto, ej. "cliente.puntos".',
      resolve: ({ condition, context }) => resolveField(context, condition.field),
      validate: (condition) =>
        condition.field.trim() === '' ? 'El campo (field) no puede estar vacío.' : null,
    },
    {
      id: 'current_datetime',
      description: 'Fecha y hora de la evaluación (ignora el campo).',
      dataType: 'DATE',
      resolve: ({ context }) => context.timestamp,
    },
    {
      id: 'current_time',
      description: 'Hora del día de la evaluación en minutos desde medianoche.',
      dataType: 'TIME',
      resolve: ({ context }) => minutesSinceMidnight(context.timestamp),
    },
    {
      id: 'channel',
      description: 'Canal de origen de la petición (web, app, qr…).',
      dataType: 'TEXT',
      resolve: ({ context }) => context.channel ?? null,
    },
  ]

  for (const type of defaults) registry.register(type)
  return registry
}
