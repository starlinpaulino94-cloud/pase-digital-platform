'use client'

import * as React from 'react'

export interface CountdownParts {
  dias: number
  horas: number
  minutos: number
  segundos: number
  /** true cuando llegó a cero. */
  terminado: boolean
}

function calcular(target: number): CountdownParts {
  const resto = Math.max(0, target - Date.now())
  return {
    dias: Math.floor(resto / 86_400_000),
    horas: Math.floor((resto / 3_600_000) % 24),
    minutos: Math.floor((resto / 60_000) % 60),
    segundos: Math.floor((resto / 1000) % 60),
    terminado: resto === 0,
  }
}

/**
 * MUK · useCountdown — cuenta regresiva sin errores de hidratación.
 *
 * Devuelve `null` en el primer render (el servidor no conoce la hora del
 * cliente) y empieza a tickear en el cliente. El componente debe mostrar un
 * placeholder mientras tanto (p. ej. "--:--").
 */
export function useCountdown(target: Date | string | number, onFinish?: () => void): CountdownParts | null {
  const targetMs = target instanceof Date ? target.getTime() : new Date(target).getTime()
  const [parts, setParts] = React.useState<CountdownParts | null>(null)
  const finishRef = React.useRef(onFinish)
  React.useEffect(() => {
    finishRef.current = onFinish
  }, [onFinish])

  React.useEffect(() => {
    // Primer tick diferido: evita setState síncrono dentro del efecto.
    const primero = setTimeout(() => setParts(calcular(targetMs)), 0)
    const id = setInterval(() => {
      const p = calcular(targetMs)
      setParts(p)
      if (p.terminado) {
        clearInterval(id)
        finishRef.current?.()
      }
    }, 1000)
    return () => {
      clearTimeout(primero)
      clearInterval(id)
    }
  }, [targetMs])

  return parts
}
