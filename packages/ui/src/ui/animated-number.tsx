'use client'

import * as React from 'react'
import { cn } from '../cn'

/**
 * MUK · AnimatedNumber — contador que sube hasta su valor (KPIs, puntos).
 *
 * Anima con requestAnimationFrame y easing out-expo; respeta
 * prefers-reduced-motion saltando directo al valor final. Formatea con
 * es-DO (separador de miles) y admite prefijo/sufijo ("RD$", " pts").
 *
 *   <AnimatedNumber value={12450} prefix="RD$" decimales={2} />
 */
function AnimatedNumber({
  value,
  duracionMs = 900,
  decimales = 0,
  prefix = '',
  suffix = '',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  value: number
  duracionMs?: number
  decimales?: number
  prefix?: string
  suffix?: string
}) {
  const [mostrado, setMostrado] = React.useState(0)
  const spanRef = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setMostrado(value))
      return () => cancelAnimationFrame(id)
    }
    const inicio = performance.now()
    let raf = 0
    const tick = (ahora: number) => {
      const p = Math.min(1, (ahora - inicio) / duracionMs)
      const eased = 1 - Math.pow(2, -10 * p) // out-expo
      setMostrado(value * (p === 1 ? 1 : eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duracionMs])

  return (
    <span
      data-slot="animated-number"
      ref={spanRef}
      className={cn('tabular-nums', className)}
      {...props}
    >
      {prefix}
      {mostrado.toLocaleString('es-DO', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      })}
      {suffix}
    </span>
  )
}

export { AnimatedNumber }
