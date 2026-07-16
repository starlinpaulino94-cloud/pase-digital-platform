'use client'

import * as React from 'react'

/**
 * MMS · useReducedMotion — ¿el usuario pidió reducir el movimiento?
 *
 * Fuente de verdad en JS para las primitivas que animan con requestAnimation
 * Frame o IntersectionObserver (las animaciones CSS ya se neutralizan solas
 * vía @media en globals.css). Server-safe: devuelve `false` en el servidor y
 * en el primer render, y se actualiza en el cliente al montar.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}
