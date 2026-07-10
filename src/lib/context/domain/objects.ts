/**
 * Context Objects: representaciones DESACOPLADAS de la información (Fase 5).
 *
 * Son formas planas y parciales, NUNCA entidades del ORM. Cada proveedor devuelve
 * uno de estos objetos para su namespace. Son deliberadamente laxos (campos
 * opcionales) para que cada industria aporte lo que tenga sin romper el contrato.
 */

export interface ClienteContext {
  readonly id: string
  readonly nombre?: string
  readonly email?: string
  readonly telefono?: string
  readonly fechaNacimiento?: Date | string | null
  readonly ciudad?: string
  readonly genero?: string
  readonly [extra: string]: unknown
}

export interface EmpresaContext {
  readonly id: string
  readonly nombre?: string
  readonly categoria?: string
  readonly tipo?: string
  readonly ciudad?: string
  readonly moneda?: string
  readonly zonaHoraria?: string
  readonly [extra: string]: unknown
}

export interface SucursalContext {
  readonly id: string
  readonly nombre?: string
  readonly ciudad?: string
  readonly [extra: string]: unknown
}

export interface EmpleadoContext {
  readonly id: string
  readonly nombre?: string
  readonly rol?: string
  readonly [extra: string]: unknown
}

export interface UsuarioContext {
  readonly id: string
  readonly email?: string
  readonly rol?: string
  readonly [extra: string]: unknown
}

export interface VehiculoContext {
  readonly id: string
  readonly tipo?: string
  readonly marca?: string
  readonly modelo?: string
  readonly [extra: string]: unknown
}

export interface CompraContext {
  readonly id?: string
  readonly total?: number
  readonly moneda?: string
  readonly items?: readonly unknown[]
  readonly [extra: string]: unknown
}

export interface ProductoContext {
  readonly id: string
  readonly nombre?: string
  readonly categoria?: string
  readonly precio?: number
  readonly [extra: string]: unknown
}

export interface ServicioContext {
  readonly id: string
  readonly nombre?: string
  readonly categoria?: string
  readonly [extra: string]: unknown
}

export interface QrContext {
  readonly id?: string
  readonly token?: string
  readonly estado?: string
  readonly [extra: string]: unknown
}

export interface MembresiaContext {
  readonly id: string
  readonly estado?: string
  readonly visitasDisponibles?: number
  readonly fechaVencimiento?: Date | string | null
  readonly [extra: string]: unknown
}

/**
 * Variables dinámicas del sistema. Se calculan en cada construcción del
 * contexto y no dependen de la base de datos.
 */
export interface SistemaContext {
  readonly timestamp: Date
  readonly horaActual: number // minutos desde medianoche
  readonly hora: number // 0-23
  readonly diaSemana: number // 0=Dom … 6=Sáb
  readonly nombreDia: string
  readonly mes: number // 1-12
  readonly anio: number
  readonly temporada: string // primavera|verano|otono|invierno (naive)
  readonly zonaHoraria?: string
  readonly idioma?: string
  readonly moneda?: string
  readonly pais?: string
  readonly ciudad?: string
  readonly ip?: string
  readonly dispositivo?: string
  readonly canal?: string
  readonly [extra: string]: unknown
}
