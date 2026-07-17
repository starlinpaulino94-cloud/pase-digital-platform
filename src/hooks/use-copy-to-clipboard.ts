'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface CopyToClipboardOptions {
  /** Mensaje del toast de éxito. Pasar `null` para no mostrar toast. */
  successMessage?: string | null
  /** Mensaje del toast de error. Pasar `null` para no mostrar toast. */
  errorMessage?: string | null
  /** ms antes de volver `copied` a `false`. */
  resetAfterMs?: number
}

/**
 * Copiar al portapapeles con feedback de "copiado" temporal + toast: el
 * patrón repetido en cada botón de compartir/invitar de la plataforma.
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text: string, options: CopyToClipboardOptions = {}) => {
    const {
      successMessage = 'Enlace copiado al portapapeles.',
      errorMessage = 'No se pudo copiar el enlace.',
      resetAfterMs = 2000,
    } = options
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (successMessage) toast.success(successMessage)
      setTimeout(() => setCopied(false), resetAfterMs)
      return true
    } catch (e) {
      console.error('[clipboard]', e)
      if (errorMessage) toast.error(errorMessage)
      return false
    }
  }, [])

  return { copied, copy }
}
