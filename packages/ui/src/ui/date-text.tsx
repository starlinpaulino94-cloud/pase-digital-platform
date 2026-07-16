import * as React from 'react'
import { cn } from '../cn'

/**
 * MUK · DateText — el ÚNICO formato de fechas de la plataforma.
 *
 * es-DO + zona America/Santo_Domingo por defecto, envuelto en <time> para
 * accesibilidad y SEO. Server-safe (se formatea en render, sin hidratación).
 *
 *   <DateText date={f} />                → 16 jul 2026
 *   <DateText date={f} formato="hora" /> → 16 jul 2026, 2:45 p. m.
 *   <DateText date={f} formato="largo" />→ 16 de julio de 2026
 */
const FORMATOS = {
  corto: { dateStyle: 'medium' },
  hora: { dateStyle: 'medium', timeStyle: 'short' },
  largo: { dateStyle: 'long' },
  largoHora: { dateStyle: 'long', timeStyle: 'short' },
  soloHora: { timeStyle: 'short' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

function DateText({
  date,
  formato = 'corto',
  timeZone = 'America/Santo_Domingo',
  className,
  ...props
}: Omit<React.TimeHTMLAttributes<HTMLTimeElement>, 'dateTime'> & {
  date: Date | string | number
  formato?: keyof typeof FORMATOS
  timeZone?: string
}) {
  const d = date instanceof Date ? date : new Date(date)
  const texto = new Intl.DateTimeFormat('es-DO', { timeZone, ...FORMATOS[formato] }).format(d)
  return (
    <time
      data-slot="date-text"
      dateTime={d.toISOString()}
      className={cn('tabular-nums', className)}
      {...props}
    >
      {texto}
    </time>
  )
}

export { DateText }
