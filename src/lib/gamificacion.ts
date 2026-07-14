// Motor de gamificación (Fase 6A) · lógica PURA y determinista, segura en
// cliente. Los puntos se DERIVAN de hechos reales del cliente (beneficios,
// visitas, referidos, membresías): no hay un saldo inventado ni almacenado,
// así que nunca hay que "cuadrar" una tabla de puntos. Cuando más adelante se
// quiera gastar puntos (ruleta, rasca-y-gana), se añadirá un libro mayor.

export interface GamificacionStats {
  beneficiosReclamados: number
  beneficiosUsados: number
  referidosCompletados: number
  membresiasActivas: number
}

/** Peso en puntos de cada hecho real (transparente y auditable). */
export const PUNTOS = {
  base: 50, // por tener cuenta
  beneficioReclamado: 100,
  beneficioUsado: 150, // usarlo (visita real) vale más que reclamarlo
  referido: 250, // lo más valioso: traer un amigo
  membresia: 200,
} as const

/** Costo en puntos de un giro de ruleta (Fase 6B). Configurable a futuro. */
export const COSTO_RULETA = 500

export function calcularPuntos(s: GamificacionStats): number {
  return (
    PUNTOS.base +
    s.beneficiosReclamados * PUNTOS.beneficioReclamado +
    s.beneficiosUsados * PUNTOS.beneficioUsado +
    s.referidosCompletados * PUNTOS.referido +
    s.membresiasActivas * PUNTOS.membresia
  )
}

export interface Nivel {
  nivel: number
  nombre: string
  min: number
  color: string
}

export const NIVELES: readonly Nivel[] = [
  { nivel: 1, nombre: 'Nuevo', min: 0, color: '#94a3b8' },
  { nivel: 2, nombre: 'Bronce', min: 300, color: '#b45309' },
  { nivel: 3, nombre: 'Plata', min: 800, color: '#64748b' },
  { nivel: 4, nombre: 'Oro', min: 1800, color: '#d97706' },
  { nivel: 5, nombre: 'Platino', min: 3500, color: '#0ea5e9' },
  { nivel: 6, nombre: 'Diamante', min: 6000, color: '#8b5cf6' },
]

export function nivelPara(puntos: number) {
  let actual = NIVELES[0]
  for (const n of NIVELES) if (puntos >= n.min) actual = n
  const siguiente = NIVELES.find((n) => n.min > actual.min) ?? null
  const rango = siguiente ? siguiente.min - actual.min : 1
  const progreso = siguiente
    ? Math.min(100, Math.max(0, Math.round(((puntos - actual.min) / rango) * 100)))
    : 100
  const faltan = siguiente ? Math.max(0, siguiente.min - puntos) : 0
  return { actual, siguiente, progreso, faltan }
}

export interface LogroDef {
  id: string
  nombre: string
  desc: string
  /** Clave de icono (se mapea a lucide en el componente). */
  icono: 'sparkles' | 'gift' | 'check' | 'crown' | 'users' | 'layers' | 'flame'
  objetivo: number
  valor: (s: GamificacionStats) => number
}

/** Logros derivados de hechos reales; se desbloquean solos al cumplir la meta. */
export const LOGROS: readonly LogroDef[] = [
  { id: 'bienvenido', nombre: 'Bienvenido', desc: 'Creaste tu cuenta', icono: 'sparkles', objetivo: 1, valor: () => 1 },
  { id: 'primer-regalo', nombre: 'Primer regalo', desc: 'Reclama tu primer beneficio', icono: 'gift', objetivo: 1, valor: (s) => s.beneficiosReclamados },
  { id: 'primera-visita', nombre: 'Primera visita', desc: 'Usa un beneficio en el negocio', icono: 'check', objetivo: 1, valor: (s) => s.beneficiosUsados },
  { id: 'miembro', nombre: 'Miembro', desc: 'Activa una membresía', icono: 'crown', objetivo: 1, valor: (s) => s.membresiasActivas },
  { id: 'embajador', nombre: 'Embajador', desc: 'Invita a un amigo', icono: 'users', objetivo: 1, valor: (s) => s.referidosCompletados },
  { id: 'coleccionista', nombre: 'Coleccionista', desc: 'Reclama 5 beneficios', icono: 'layers', objetivo: 5, valor: (s) => s.beneficiosReclamados },
  { id: 'super-referidor', nombre: 'Súper referidor', desc: 'Invita a 5 amigos', icono: 'flame', objetivo: 5, valor: (s) => s.referidosCompletados },
]
