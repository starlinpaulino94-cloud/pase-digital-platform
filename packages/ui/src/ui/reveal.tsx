'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../cn'

const ANIM = {
  'fade-up': 'animate-fade-up',
  fade: 'animate-fade-in',
  'slide-right': 'animate-slide-in-right',
  'slide-left': 'animate-slide-in-left',
  scale: 'animate-zoom-in',
} as const

export type RevealAnim = keyof typeof ANIM

/**
 * MMS · Reveal — el contenido aparece al entrar al viewport.
 *
 * Base de las entradas de pantalla y las cascadas. Sin IntersectionObserver,
 * o con reduce-motion (las clases `animate-*` se neutralizan vía @media en
 * globals.css), el contenido simplemente se muestra — nunca queda invisible.
 *
 *   <Reveal anim="scale" delay={120}>…</Reveal>
 */
export function Reveal({
  children,
  className,
  delay = 0,
  anim = 'fade-up',
  once = true,
}: {
  children: ReactNode
  className?: string
  /** Retraso de la animación en ms (para escalonar listas). */
  delay?: number
  /** Estilo de entrada. */
  anim?: RevealAnim
  /** Animar solo la primera vez (default) o cada vez que entra al viewport. */
  once?: boolean
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
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true)
            if (once) io.disconnect()
          } else if (!once) {
            setShown(false)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once])

  return (
    <div
      ref={ref}
      className={cn(shown ? ANIM[anim] : 'opacity-0', className)}
      style={delay && shown ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
