'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Contador que sube animado (ease-out) la primera vez que entra al viewport.
 * Con prefers-reduced-motion (o sin IntersectionObserver) muestra el valor
 * final directamente. Renderiza solo texto: hereda la tipografía del padre.
 */
export function AnimatedCounter({
  value,
  duration = 900,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number
  /** Duración de la animación en ms. */
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function animate() {
      if (startedRef.current) return
      startedRef.current = true
      if (reduced || value <= 0) {
        setDisplay(value)
        return
      }
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(Math.round(value * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    if (typeof IntersectionObserver === 'undefined') {
      animate()
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          animate()
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString('es-DO')}
      {suffix}
    </span>
  )
}
