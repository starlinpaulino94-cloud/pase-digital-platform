'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, Gift, Clock, Flame, ArrowRight } from 'lucide-react'
import type { Momento } from '@/modules/engagement/momentos'
import type { CampanaViva } from '@/modules/engagement/campanas'

const STORAGE_KEY = 'membego_popup_seen'
const VENTANA_MS = 24 * 60 * 60 * 1000 // no repetir el mismo aviso en 24h
const DELAY_MS = 1200 // deja asentar el Home (estilo Temu)

interface Candidato {
  key: string
  icon: typeof Gift
  titulo: string
  mensaje: string
  ctaTexto: string
  ctaHref: string
}

/** Elige EL aviso más importante y accionable (o null si no hay ninguno). */
function elegirCandidato(momentos: Momento[], campanas: CampanaViva[]): Candidato | null {
  // 1) Beneficio por vencer (lo más urgente: no queremos que lo pierda).
  const vence = momentos.find((m): m is Extract<Momento, { tipo: 'VENCE' }> => m.tipo === 'VENCE')
  if (vence) {
    const dias = Math.max(
      0,
      Math.ceil((new Date(vence.expiraEn).getTime() - Date.now()) / 86_400_000)
    )
    return {
      key: `vence:${vence.compraId}`,
      icon: Clock,
      titulo: '⏰ Tu beneficio está por vencer',
      mensaje:
        dias <= 0
          ? `«${vence.titulo}» vence hoy. Úsalo antes de que expire.`
          : `«${vence.titulo}» vence en ${dias} día${dias !== 1 ? 's' : ''}. No lo dejes pasar.`,
      ctaTexto: 'Ver mi beneficio',
      ctaHref: '/cliente/mis-promociones',
    }
  }

  // 2) Beneficio listo para usar.
  const regalo = momentos.find((m): m is Extract<Momento, { tipo: 'REGALO' }> => m.tipo === 'REGALO')
  if (regalo) {
    return {
      key: `regalo:${regalo.compraId}`,
      icon: Gift,
      titulo: '🎁 Tienes un beneficio listo',
      mensaje: `«${regalo.titulo}» está listo para usar. Preséntalo en el negocio con tu código.`,
      ctaTexto: 'Usar ahora',
      ctaHref: '/cliente/mis-promociones',
    }
  }

  // 3) Campaña destacada viva (solo las destacadas, para no molestar).
  const camp = campanas.find((c) => c.destacada)
  if (camp) {
    return {
      key: `campana:${camp.id}`,
      icon: Flame,
      titulo: camp.titulo,
      mensaje: camp.descripcion,
      ctaTexto: camp.ctaTexto || 'Ver oferta',
      ctaHref: camp.ctaHref || '/cliente/promociones',
    }
  }

  return null
}

function yaVisto(key: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const map = JSON.parse(raw) as Record<string, number>
    const ts = map[key]
    return typeof ts === 'number' && Date.now() - ts < VENTANA_MS
  } catch {
    return false
  }
}

function marcarVisto(key: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    map[key] = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // localStorage no disponible: el popup simplemente reaparecerá otro día.
  }
}

/**
 * Engagement Engine · Fase 8 — Popup inteligente.
 * Muestra UN aviso importante disparado por el estado real del cliente (beneficio
 * por vencer / listo / oferta destacada), como máximo una vez cada 24h por aviso.
 * No molesto: se puede cerrar y no reaparece hasta que cambie la condición.
 */
export function PopupInteligente({
  momentos,
  campanas,
  color,
}: {
  momentos: Momento[]
  campanas: CampanaViva[]
  color?: string
}) {
  const [cand, setCand] = useState<Candidato | null>(null)
  const [visible, setVisible] = useState(false)
  const accent = color || '#0ea5e9'

  useEffect(() => {
    const c = elegirCandidato(momentos, campanas)
    if (!c || yaVisto(c.key)) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(
      () => {
        setCand(c)
        setVisible(true)
      },
      reduced ? 0 : DELAY_MS
    )
    return () => window.clearTimeout(id)
    // Solo al montar: el aviso se decide una vez por carga del Home.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cerrar = () => {
    if (cand) marcarVisto(cand.key)
    setVisible(false)
  }

  if (!cand || !visible) return null
  const Icon = cand.icon

  // Portal al <body>: dentro del contenido, la transición de página
  // (template.tsx) crea un containing block y el `fixed` se ancla a la
  // página (larga) en vez de a la ventana — el aviso quedaba fuera de
  // vista, abajo. En el body, `fixed` es SIEMPRE la ventana: centrado
  // garantizado sin importar el scroll.
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-5">
      <button
        className="animate-fade-in absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={cerrar}
      />

      {/* Entrada con rebote elástico (MMS · burst) + halo de marca que respira */}
      <div
        className="animate-burst shine shine-loop relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-hero"
        style={{ ['--glow-color' as string]: '255 255 255' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Barrido de luz continuo sobre toda la tarjeta (elemento vivo) */}
        <span aria-hidden className="shine-sweep z-20" />

        <button
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── Cabecera hero con gradiente de la empresa ── */}
        <div
          className="relative overflow-hidden px-6 pb-14 pt-10 text-center"
          style={{ background: `linear-gradient(140deg, ${accent}, ${accent}99 60%, ${accent}66)` }}
        >
          {/* Halos decorativos */}
          <span aria-hidden className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-16 -right-8 h-44 w-44 rounded-full bg-black/10 blur-3xl" />
          {/* Destellos que laten en cascada */}
          <span aria-hidden className="animate-pulse-glow absolute left-8 top-8 text-lg text-white/90">✦</span>
          <span aria-hidden className="animate-pulse-glow delay-300 absolute right-12 top-14 text-xs text-white/80">✦</span>
          <span aria-hidden className="animate-pulse-glow delay-500 absolute bottom-10 left-14 text-sm text-white/70">✦</span>

          {/* Icono flotando con anillo de vidrio */}
          <span className="animate-float relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/30 bg-white/20 text-white shadow-glow backdrop-blur-md">
            <Icon className="h-10 w-10 drop-shadow" />
          </span>
        </div>

        {/* ── Contenido: la tarjeta blanca "muerde" el gradiente ── */}
        <div className="relative -mt-6 rounded-t-3xl bg-card px-6 pb-6 pt-6 text-center">
          <h2 className="text-h2 text-foreground">{cand.titulo}</h2>
          <p className="mx-auto mt-2 max-w-[30ch] text-sm leading-relaxed text-muted-foreground">
            {cand.mensaje}
          </p>

          {/* CTA protagonista: grande, pulsando suavemente, en zona del pulgar */}
          <Link
            href={cand.ctaHref}
            onClick={cerrar}
            className="animate-pulse-soft mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-bold text-white shadow-floating transition-transform active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}d9)` }}
          >
            {cand.ctaTexto}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <button
            onClick={cerrar}
            className="mt-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
