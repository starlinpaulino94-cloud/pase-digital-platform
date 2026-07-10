'use client'

import { useState } from 'react'
import { Share2, Copy, Check, MessageCircle, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

interface CompartirOfertaButtonProps {
  /** Ruta pública relativa (se resuelve contra el dominio actual). */
  path: string
  titulo: string
  /** Texto que acompaña al enlace (WhatsApp / share nativo). */
  texto: string
  /**
   * Aviso cuando el enlace no será visible para todo el mundo (promoción
   * pausada, privada, publicación oculta…). Se muestra en el menú; compartir
   * sigue permitido (p. ej. promos privadas para clientes con cuenta).
   */
  advertencia?: string | null
  /** 'icon' = botón compacto para filas; 'full' = botón con etiqueta. */
  variant?: 'icon' | 'full'
  /** Etiqueta del botón en variant='full'. */
  label?: string
}

/**
 * Compartir una oferta (promoción, publicación, planes, perfil) desde el
 * panel admin: WhatsApp, share nativo del dispositivo o copiar el enlace.
 */
export function CompartirOfertaButton({
  path,
  titulo,
  texto,
  advertencia = null,
  variant = 'icon',
  label = 'Compartir',
}: CompartirOfertaButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const url = () => `${window.location.origin}${path}`
  const mensaje = () => `${texto} ${url()}`

  async function compartirNativo() {
    setOpen(false)
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, text: texto, url: url() })
        return
      }
      await copiar()
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      toast.error('No se pudo compartir.')
    }
  }

  async function copiar() {
    setOpen(false)
    try {
      await navigator.clipboard.writeText(url())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Enlace copiado.')
    } catch {
      toast.error('No se pudo copiar el enlace.')
    }
  }

  function whatsapp() {
    setOpen(false)
    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensaje())}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Compartir"
        aria-label="Compartir"
        className={
          variant === 'icon'
            ? 'inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900'
            : 'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
        }
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {variant === 'full' && label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
            {advertencia && (
              <p className="mx-2 mb-1 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {advertencia}
              </p>
            )}
            <button
              onClick={whatsapp}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" /> Enviar por WhatsApp
            </button>
            <button
              onClick={compartirNativo}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Share2 className="h-4 w-4 text-sky-600" /> Compartir…
            </button>
            <button
              onClick={copiar}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Copy className="h-4 w-4 text-slate-500" /> Copiar enlace
            </button>
          </div>
        </>
      )}
    </div>
  )
}
