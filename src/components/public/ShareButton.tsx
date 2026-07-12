'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ShareButtonProps {
  title: string
  text: string
  /** Ruta relativa (se resuelve contra el dominio actual). */
  path: string
  /** Se llama tras compartir con éxito (p. ej. registrar shareCount). */
  onShared?: () => void
  className?: string
  label?: string
}

/**
 * Compartir con el sistema nativo del teléfono (navigator.share) y respaldo
 * de copiar el enlace al portapapeles en escritorio.
 */
export function ShareButton({
  title,
  text,
  path,
  onShared,
  className,
  label = 'Compartir',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        onShared?.()
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Enlace copiado al portapapeles.')
      onShared?.()
    } catch (e) {
      // El usuario canceló el share nativo: no es un error.
      if (e instanceof DOMException && e.name === 'AbortError') return
      console.error('[share]', e)
      toast.error('No se pudo compartir.')
    }
  }

  return (
    <button
      onClick={handleShare}
      className={
        className ??
        'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 font-semibold text-muted-foreground transition hover:bg-muted sm:w-auto'
      }
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Share2 className="h-4 w-4" />}
      {label}
    </button>
  )
}
