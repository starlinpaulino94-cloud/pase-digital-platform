/**
 * Ventana de ejecución del Automation Engine (Fase E1): horarios, días
 * permitidos, fechas de inicio/fin y límites por sujeto/total. Evaluación pura
 * contra contadores ya calculados por el repositorio.
 */

import type { AutomationLimits, AutomationSchedule } from './types'

export type WindowDenyCode =
  | 'BEFORE_START'
  | 'AFTER_END'
  | 'DAY_NOT_ALLOWED'
  | 'HOUR_NOT_ALLOWED'

/** ¿Está `now` dentro de la ventana de horario/días/fechas del programa? */
export function withinWindow(
  schedule: AutomationSchedule | undefined,
  now: Date = new Date(),
): { allowed: boolean; denials: WindowDenyCode[] } {
  const denials: WindowDenyCode[] = []
  if (!schedule) return { allowed: true, denials }

  if (schedule.startAt && now < new Date(schedule.startAt)) denials.push('BEFORE_START')
  if (schedule.endAt && now > new Date(schedule.endAt)) denials.push('AFTER_END')

  if (schedule.days && schedule.days.length > 0 && !schedule.days.includes(now.getDay())) {
    denials.push('DAY_NOT_ALLOWED')
  }

  if (schedule.hours) {
    const cur = now.getHours() * 60 + now.getMinutes()
    const from = toMinutes(schedule.hours.from)
    const to = toMinutes(schedule.hours.to)
    if (from != null && to != null && !(cur >= from && cur <= to)) {
      denials.push('HOUR_NOT_ALLOWED')
    }
  }

  return { allowed: denials.length === 0, denials }
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

export type LimitDenyCode = 'MAX_PER_SUBJECT' | 'MAX_TOTAL'

/** ¿Se respetan los límites de ejecución? */
export function withinLimits(
  limits: AutomationLimits | undefined,
  ctx: { subjectRuns?: number; totalRuns?: number } = {},
): { allowed: boolean; denials: LimitDenyCode[] } {
  const denials: LimitDenyCode[] = []
  if (!limits) return { allowed: true, denials }
  if (limits.maxPerSubject != null && (ctx.subjectRuns ?? 0) >= limits.maxPerSubject) {
    denials.push('MAX_PER_SUBJECT')
  }
  if (limits.maxTotal != null && (ctx.totalRuns ?? 0) >= limits.maxTotal) {
    denials.push('MAX_TOTAL')
  }
  return { allowed: denials.length === 0, denials }
}

/** Inicio de la ventana del límite por sujeto (para contar ejecuciones). */
export function limitWindowStart(limits: AutomationLimits | undefined, now = new Date()): Date | undefined {
  const period = limits?.perPeriod
  if (!period || period === 'EVER') return undefined
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (period === 'WEEK') d.setDate(d.getDate() - 6)
  if (period === 'MONTH') d.setDate(1)
  if (period === 'YEAR') {
    d.setMonth(0, 1)
  }
  return d
}
