'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../cn'

/**
 * Scroll reveal: el contenido aparece con fade-in + slide-up la primera vez
 * que entra al viewport. Sin IntersectionObserver (o con reduced motion vía
 * los estilos globales) el contenido simplemente se muestra.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  /** Retraso de la animación en ms (para escalonar listas). */
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      // Navegadores sin IO: mostrar directo en el DOM, sin re-render.
      el.classList.remove('opacity-0')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(shown ? 'animate-fade-up' : 'opacity-0', className)}
      style={delay && shown ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
