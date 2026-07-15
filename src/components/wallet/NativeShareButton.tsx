'use client'

import { useCallback, useState, type ReactNode } from 'react'
import { Loader2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NativeShareButtonProps {
  /** Título para la hoja de compartir del sistema. */
  title: string
  /** Texto que acompaña al contenido compartido. */
  text: string
  /** Genera el archivo (imagen) a compartir. Se cachea tras el primer uso. */
  getFile?: () => Promise<File | null>
  /** Se invoca SOLO cuando el contenido se compartió/descargó de verdad. */
  onShared?: () => void | Promise<void>
  className?: string
  children?: ReactNode
}

/**
 * Botón de compartir inteligente:
 * 1. En móvil usa `navigator.share` con la imagen → abre la hoja nativa del
 *    sistema (WhatsApp, Telegram, guardar en fotos…), sin colores de terceros.
 * 2. Si el navegador no soporta compartir archivos, comparte solo el texto.
 * 3. En desktop sin Web Share, descarga la imagen y avisa con un toast.
 *
 * Cancelar la hoja de compartir NO cuenta como envío (AbortError se ignora).
 */
export function NativeShareButton({
  title,
  text,
  getFile,
  onShared,
  className,
  children,
}: NativeShareButtonProps) {
  const [busy, setBusy] = useState(false)

  const handleClick = useCallback(async () => {
    setBusy(true)
    try {
      const file = getFile ? await getFile() : null
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean
      }

      // 1) Hoja nativa con la imagen adjunta.
      if (file && typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title, text })
          await onShared?.()
          return
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          // Si compartir archivos falla, seguimos con los fallbacks.
        }
      }

      // 2) Hoja nativa solo con texto.
      if (typeof nav.share === 'function') {
        try {
          await nav.share({ title, text })
          await onShared?.()
          return
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
        }
      }

      // 3) Desktop sin Web Share: descargar la imagen para adjuntarla a mano.
      if (file) {
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 4000)
        toast.success('Imagen guardada. Adjúntala en tu app de mensajes favorita.')
        await onShared?.()
        return
      }

      toast.error('Tu navegador no permite compartir desde aquí.')
    } finally {
      setBusy(false)
    }
  }, [getFile, title, text, onShared])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={cn(
        // min-h-12 = 48px: target táctil accesible en móvil.
        'inline-flex min-h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60',
        className
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
      {children ?? 'Compartir'}
    </button>
  )
}
