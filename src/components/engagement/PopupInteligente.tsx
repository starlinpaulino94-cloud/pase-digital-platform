'use client'

import { useEffect, useState } from 'react'
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

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-4 sm:items-center">
      <button
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={cerrar}
      />
      <style>{`
        @keyframes popup-in { 0% { transform: translateY(16px) scale(0.98); opacity: 0 } 100% { transform: translateY(0) scale(1); opacity: 1 } }
      `}</style>
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-2xl"
        style={{ animation: 'popup-in 0.35s cubic-bezier(0.16,1,0.3,1)' }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-muted-foreground transition hover:bg-black/10 dark:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <span
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
          >
            <Icon className="h-8 w-8" />
          </span>
          <h2 className="text-xl font-extrabold text-foreground">{cand.titulo}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{cand.mensaje}</p>

          <Link
            href={cand.ctaHref}
            onClick={cerrar}
            className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-3.5 text-base font-bold text-white shadow-lg transition hover:scale-[1.02]"
            style={{ backgroundColor: accent }}
          >
            {cand.ctaTexto}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button onClick={cerrar} className="mt-2 text-xs text-muted-foreground hover:underline">
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
