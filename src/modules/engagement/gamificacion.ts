import { prisma } from '@/lib/prisma'
import {
  calcularPuntos,
  nivelPara,
  LOGROS,
  type GamificacionStats,
  type LogroDef,
} from '@/lib/gamificacion'

/**
 * Engagement Engine · Fase 6A — Gamificación (puntos + niveles + logros).
 *
 * Los puntos se DERIVAN de hechos reales del cliente (beneficios reclamados y
 * usados, referidos completados, membresías activas). No se inventan ni se
 * guardan: si algo falla, devuelve null y el Home no muestra la tarjeta.
 */

export interface LogroData {
  id: string
  nombre: string
  desc: string
  icono: LogroDef['icono']
  objetivo: number
  valor: number
  desbloqueado: boolean
}

export interface GamificacionData {
  puntos: number
  nivel: { nivel: number; nombre: string; color: string }
  siguiente: { nombre: string; min: number } | null
  progreso: number
  faltan: number
  logros: LogroData[]
  stats: GamificacionStats
}

export async function getGamificacion(
  clienteId: string,
  companyId: string
): Promise<GamificacionData | null> {
  try {
    const [beneficiosReclamados, beneficiosUsados, referidosCompletados, membresiasActivas] =
      await Promise.all([
        prisma.productoCompra.count({
          where: { clienteId, companyId, estado: { in: ['ACTIVA', 'CONSUMIDA'] } },
        }),
        prisma.productoCompra.count({
          where: { clienteId, companyId, estado: 'CONSUMIDA' },
        }),
        prisma.referido.count({
          where: { referenteClienteId: clienteId, companyId, estado: 'COMPLETADO' },
        }),
        prisma.membership.count({ where: { clienteId, companyId, estado: 'ACTIVA' } }),
      ])

    const stats: GamificacionStats = {
      beneficiosReclamados,
      beneficiosUsados,
      referidosCompletados,
      membresiasActivas,
    }

    const puntos = calcularPuntos(stats)
    const { actual, siguiente, progreso, faltan } = nivelPara(puntos)

    const logros: LogroData[] = LOGROS.map((l) => {
      const real = l.valor(stats)
      return {
        id: l.id,
        nombre: l.nombre,
        desc: l.desc,
        icono: l.icono,
        objetivo: l.objetivo,
        valor: Math.min(l.objetivo, real),
        desbloqueado: real >= l.objetivo,
      }
    })

    return {
      puntos,
      nivel: { nivel: actual.nivel, nombre: actual.nombre, color: actual.color },
      siguiente: siguiente ? { nombre: siguiente.nombre, min: siguiente.min } : null,
      progreso,
      faltan,
      logros,
      stats,
    }
  } catch (e) {
    console.error('[engagement] getGamificacion:', e)
    return null
  }
}
