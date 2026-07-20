import { utcDesdeLocal, ymdEnTz, sumarDias, diaSemanaDeYmd } from '@/modules/citas/disponibilidad'
import type { OfertaPeriodo } from '@prisma/client'

/**
 * Ofertas VIP · inicio del período de cupo vigente, en la zona horaria del
 * negocio. MENSUAL = 1ro del mes actual; SEMANAL = lunes de la semana actual;
 * TOTAL = sin reinicio (época).
 */
export function inicioPeriodo(periodo: OfertaPeriodo, timeZone: string, ahora = new Date()): Date {
  if (periodo === 'TOTAL') return new Date(0)
  const hoy = ymdEnTz(ahora, timeZone)
  if (periodo === 'MENSUAL') {
    return utcDesdeLocal(`${hoy.slice(0, 7)}-01`, '00:00', timeZone)
  }
  // SEMANAL: retroceder hasta el lunes (dia 1; domingo=0 retrocede 6).
  const dia = diaSemanaDeYmd(hoy, timeZone)
  const lunes = sumarDias(hoy, dia === 0 ? -6 : 1 - dia)
  return utcDesdeLocal(lunes, '00:00', timeZone)
}

export const PERIODO_LABEL: Record<OfertaPeriodo, string> = {
  SEMANAL: 'por semana',
  MENSUAL: 'al mes',
  TOTAL: 'en total',
}
