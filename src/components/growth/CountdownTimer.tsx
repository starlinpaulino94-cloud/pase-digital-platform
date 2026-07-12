'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

interface CountdownTimerProps {
  /** Instante de expiración en ISO (calculado y verificado en servidor). */
  expiresAt: string
  /** Se llama cuando el contador llega a cero (p. ej. refrescar la landing). */
  onExpire?: () => void
}

function calcRestante(target: number) {
  return Math.max(0, target - Date.now())
}

function partes(ms: number) {
  const totalSeg = Math.floor(ms / 1000)
  const dias = Math.floor(totalSeg / 86400)
  const horas = Math.floor((totalSeg % 86400) / 3600)
  const min = Math.floor((totalSeg % 3600) / 60)
  const seg = totalSeg % 60
  return { dias, horas, min, seg }
}

const pad = (n: number) => n.toString().padStart(2, '0')

/**
 * Growth Engine 3.0 · Contador regresivo grande y moderno (req #3). El tiempo
 * restante viene del servidor (expiresAt) — el navegador solo lo anima. Usa el
 * patrón "montado" para no romper la hidratación.
 */
export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const target = new Date(expiresAt).getTime()
  // Patrón "montado" sin setState-en-efecto: server=false, cliente=true.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [restante, setRestante] = useState(() => calcRestante(target))

  useEffect(() => {
    const id = setInterval(() => {
      const r = calcRestante(target)
      setRestante(r)
      if (r <= 0) {
        clearInterval(id)
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [target, onExpire])

  const { dias, horas, min, seg } = partes(restante)
  // Antes de montar, render estable para evitar mismatch de hidratación.
  const label = mounted ? undefined : 'placeholder'

  const bloques: { v: number; t: string }[] = [
    ...(dias > 0 ? [{ v: dias, t: 'días' }] : []),
    { v: horas, t: 'h' },
    { v: min, t: 'min' },
    { v: seg, t: 'seg' },
  ]

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" aria-label={label}>
      {bloques.map((b, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="min-w-[3.5rem] rounded-2xl bg-foreground/90 px-3 py-2.5 text-center font-mono text-3xl font-bold tabular-nums text-background shadow-premium sm:min-w-[4.5rem] sm:text-4xl">
            {pad(b.v)}
          </div>
          <span className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {b.t}
          </span>
        </div>
      ))}
    </div>
  )
}
