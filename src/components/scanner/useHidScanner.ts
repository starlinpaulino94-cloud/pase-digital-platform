'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { HidScanBuffer } from '@/lib/scanner/hid'

/** Estado visible del lector físico. */
export type ReaderStatus = 'ready' | 'listening' | 'received'

/**
 * Fase E7 · Hook para leer con un lector físico HID (USB/Bluetooth/inalámbrico).
 *
 * Mantiene el foco en un campo OCULTO de captura: cuando el lector "teclea" el
 * código, se detecta la ráfaga y, al recibir Enter, se entrega el token —sin
 * clics ni interacción del usuario—. El foco se recupera solo tras cada lectura
 * para escanear clientes de forma continua.
 *
 * `active`  → activa la captura y el foco automático.
 * `disabled`→ pausa la captura (p. ej. mientras el servidor valida).
 * `onScan`  → recibe (token, fromReader) para seguir el MISMO flujo que la cámara.
 */
export function useHidScanner({
  active,
  disabled = false,
  onScan,
}: {
  active: boolean
  disabled?: boolean
  onScan: (token: string, fromReader: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  // Instancia estable del buffer (una sola por montaje), sin acceder a refs
  // durante el render.
  const [buffer] = useState(() => new HidScanBuffer())
  const [status, setStatus] = useState<ReaderStatus>('ready')
  const receivedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const focusCapture = useCallback(() => {
    if (!active || disabled) return
    const el = inputRef.current
    if (el && document.activeElement !== el) el.focus({ preventScroll: true })
  }, [active, disabled])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return
      // Combinaciones con modificador (Alt+C / Alt+L…) son ATAJOS, no código:
      // se dejan pasar al listener global sin capturarlas en el buffer.
      if (e.altKey || e.ctrlKey || e.metaKey) return
      // Evita que Enter/Tab del lector disparen submits o cambien el foco.
      if (e.key === 'Enter' || e.key === 'Tab') e.preventDefault()

      const res = buffer.push(e.key, e.timeStamp)
      if (res) {
        setStatus('received')
        if (receivedTimer.current) clearTimeout(receivedTimer.current)
        receivedTimer.current = setTimeout(() => setStatus('ready'), 900)
        onScan(res.code, res.fromReader)
      } else if (buffer.length > 0) {
        setStatus('listening')
      }
    },
    [disabled, onScan, buffer]
  )

  // Al perder el foco (clic accidental, cambio de ventana), lo recupera para
  // no interrumpir el escaneo continuo. No roba el foco de controles reales.
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const next = e.relatedTarget as HTMLElement | null
      const esControl =
        next && ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(next.tagName)
      if (esControl) return
      setTimeout(focusCapture, 60)
    },
    [focusCapture]
  )

  // Enfoca al activar / reactivar; limpia el buffer y el estado. El setState va
  // dentro del callback diferido (no en el cuerpo síncrono del efecto).
  useEffect(() => {
    if (!active || disabled) return
    const t = setTimeout(() => {
      buffer.reset()
      setStatus('ready')
      focusCapture()
    }, 50)
    return () => clearTimeout(t)
  }, [active, disabled, focusCapture, buffer])

  useEffect(() => {
    return () => {
      if (receivedTimer.current) clearTimeout(receivedTimer.current)
    }
  }, [])

  return { inputRef, status, focusCapture, handleKeyDown, handleBlur }
}
