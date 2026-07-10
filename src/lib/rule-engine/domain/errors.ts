/**
 * Errores de dominio del Motor Universal de Reglas.
 *
 * Son errores tipados y específicos para que las capas superiores puedan
 * distinguir un fallo de configuración (regla mal definida) de un fallo de
 * infraestructura (BD caída) sin inspeccionar mensajes de texto.
 */

/** Raíz de la jerarquía: todo error propio del motor hereda de aquí. */
export class RuleEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

/** Se referenció un operador que no existe en el registro. */
export class UnknownOperatorError extends RuleEngineError {
  constructor(public readonly operatorId: string) {
    super(`Operador desconocido: "${operatorId}". Regístralo en el OperatorRegistry.`)
  }
}

/** Se intentó registrar dos veces la misma clave (operador o acción). */
export class DuplicateRegistrationError extends RuleEngineError {
  constructor(kind: 'operador' | 'acción', key: string) {
    super(`Ya existe un ${kind} registrado con la clave "${key}".`)
  }
}

/** Una condición está mal formada (campo/operador/valor inválidos). */
export class InvalidConditionError extends RuleEngineError {
  constructor(message: string) {
    super(`Condición inválida: ${message}`)
  }
}
