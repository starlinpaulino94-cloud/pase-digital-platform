/**
 * SystemContextProvider (Fase 5): aporta el namespace `sistema.*`.
 *
 * Calcula las VARIABLES DINÁMICAS a partir de la petición (no consulta la BD):
 * hora, día de la semana, mes, temporada, zona horaria, idioma, moneda, país,
 * ciudad, IP, dispositivo y canal. Totalmente implementado.
 */

import { NAMESPACES } from '../domain/namespaces'
import type { SistemaContext } from '../domain/objects'
import type { ContextProvider, ProviderInput } from '../domain/provider'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** Temporada (hemisferio norte, naïve). Configurable por industria en el futuro. */
function temporadaDe(mes: number): string {
  if (mes === 12 || mes <= 2) return 'invierno'
  if (mes <= 5) return 'primavera'
  if (mes <= 8) return 'verano'
  return 'otono'
}

export class SystemContextProvider implements ContextProvider<SistemaContext> {
  readonly namespace = NAMESPACES.SISTEMA

  provide({ request }: ProviderInput): SistemaContext {
    const now = request.timestamp ?? new Date()
    const mes = now.getMonth() + 1
    return {
      timestamp: now,
      horaActual: now.getHours() * 60 + now.getMinutes(),
      hora: now.getHours(),
      diaSemana: now.getDay(),
      nombreDia: DIAS[now.getDay()],
      mes,
      anio: now.getFullYear(),
      temporada: temporadaDe(mes),
      zonaHoraria: request.timezone,
      idioma: request.locale,
      moneda: request.currency,
      pais: request.country,
      ciudad: request.city,
      ip: request.ip,
      dispositivo: request.device,
      canal: request.channel,
    }
  }
}
