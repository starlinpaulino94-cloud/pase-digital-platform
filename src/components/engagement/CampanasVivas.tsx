'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Flame, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CampanaViva } from '@/modules/engagement/campanas'

const emptySubscribe = () => () => {}
const pad = (n: number) => n.toString().padStart(2, '0')

/** Detecta prefers-reduced-motion (SSR-safe: false hasta montar). */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Contador grande en vivo (SSR-safe). */
function Contador({ expiraEn }: { expiraEn: string }) {
  const target = new Date(expiraEn).getTime()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [ms, setMs] = useState(() => Math.max(0, target - Date.now()))
  useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, target - Date.now())), 1000)
    return () => clearInterval(id)
  }, [target])

  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const bloques = d > 0
    ? [{ v: d, t: 'días' }, { v: h, t: 'h' }, { v: m, t: 'm' }]
    : [{ v: h, t: 'h' }, { v: m, t: 'm' }, { v: sec, t: 's' }]

  return (
    <div className="flex items-center gap-1.5" aria-label={mounted ? undefined : 'placeholder'}>
      {bloques.map((b, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="min-w-[2.5rem] rounded-lg bg-white/25 px-2 py-1 text-center font-mono text-lg font-bold tabular-nums text-white">
            {pad(b.v)}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase text-white/70">{b.t}</span>
        </div>
      ))}
    </div>
  )
}

function Banner({ c }: { c: CampanaViva }) {
  const primary = c.colorPrimario || '#e11d48'
  const secondary = c.colorSecundario || '#9f1239'
  const arte = c.bannerUrl || c.imagenUrl

  return (
    <div
      className="animate-slide-up relative overflow-hidden rounded-3xl p-5 text-white shadow-premium sm:p-6"
      style={{ background: `linear-gradient(120deg, ${primary}, ${secondary})` }}
    >
      {arte && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={arte} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${primary}ee, ${secondary}cc)` }} />
        </>
      )}
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
            <Flame className="h-3.5 w-3.5" /> Solo por tiempo limitado
          </span>
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {c.titulo}
          </h2>
          <p className="max-w-lg text-sm text-white/85">{c.descripcion}</p>
          {c.cuposRestantes != null && c.cuposRestantes <= 50 && (
            <p className="text-xs font-bold text-white">
              🔥 ¡Solo quedan {c.cuposRestantes} cupo{c.cuposRestantes !== 1 ? 's' : ''}!
            </p>
          )}
          {c.reclamados > 0 && (
            <p className="text-xs font-semibold text-white/90">
              ✅ {c.reclamados} persona{c.reclamados !== 1 ? 's' : ''} ya
              {c.reclamados !== 1 ? ' reclamaron' : ' reclamó'}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/70">Termina en</p>
            <Contador expiraEn={c.terminaEn} />
          </div>
          {c.ctaHref && (
            <Link
              href={c.ctaHref}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold shadow-md transition hover:scale-105"
              style={{ color: primary }}
            >
              {c.ctaTexto || 'Aprovecha ahora'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Engagement Engine · Fase 5 — Banners rotativos.
 * Muestra las campañas vivas como un carrusel que rota con animación, en el
 * orden de prioridad que resuelve el servidor (destacada → prioridad → cierre).
 * Con una sola campaña se muestra fija; con varias, rota automáticamente
 * (salvo prefers-reduced-motion) y permite avanzar a mano.
 */
export function CampanasVivas({ campanas }: { campanas: CampanaViva[] }) {
  const reduced = useReducedMotion()
  const [i, setI] = useState(0)
  const [pausado, setPausado] = useState(false)
  const n = campanas.length
  // `idx` se deriva SIEMPRE con módulo: aunque cambie el nº de campañas, el
  // índice renderizado nunca queda fuera de rango (sin efectos de corrección).
  const idx = n > 0 ? i % n : 0

  // Auto-rotación (cada 6s), salvo movimiento reducido, pausa o una sola.
  useEffect(() => {
    if (reduced || pausado || n <= 1) return
    const id = setInterval(() => setI((x) => (x + 1) % n), 6000)
    return () => clearInterval(id)
  }, [reduced, pausado, n])

  const touchX = useRef<number | null>(null)

  if (n === 0) return null

  const ir = (delta: number) => setI((x) => (x + delta + n) % n)

  return (
    <div
      className="mb-8"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
      aria-roledescription="carrusel"
    >
      <div className="relative">
        {/* La key fuerza el re-montaje → dispara la animación de entrada. */}
        <div key={reduced ? 'static' : idx} className={reduced ? '' : 'animate-slide-up'}>
          <Banner c={campanas[idx]} />
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => ir(-1)}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => ir(1)}
              aria-label="Siguiente"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Indicadores de posición */}
      {n > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {campanas.map((c, k) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Ir a la campaña ${k + 1}`}
              aria-current={k === idx}
              className={`h-2 rounded-full transition-all ${
                k === idx ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
