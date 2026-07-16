'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { HidScanBuffer } from '@/lib/scanner/hid'

/** Estado visible del lector físico. */
export type ReaderStatus = 'ready' | 'listening' | 'received'

/**
 * Fase E7 · Hook para leer con un lector físico HID (USB/Bluetooth/inalámbrico).
 *
 * La captura escucha las teclas EN LA VENTANA (fase captura), no en un campo:
 * la ráfaga del lector se procesa aunque el foco esté en el body, en un botón
 * o en ningún lado. Antes dependía del foco de un input oculto y la primera
 * lectura se perdía si el foco andaba en otra parte (había que escanear dos
 * veces); ahora UNA lectura basta desde cualquier estado de la pantalla.
 *
 * El campo oculto se conserva solo para "aparcar" el foco (evita scroll con
 * espacio y teclado en pantalla en móvil); ya no procesa teclas por sí mismo.
 *
 * `focusActive` → mantiene el foco aparcado en el campo oculto (modo lector).
 * `disabled`    → pausa la captura (p. ej. mientras el servidor valida).
 * `onScan`      → recibe (token, fromReader); decide el llamador según su estado.
 */
export function useHidScanner({
  focusActive,
  disabled = false,
  onScan,
}: {
  focusActive: boolean
  disabled?: boolean
  onScan: (token: string, fromReader: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  // Instancia estable del buffer (una sola por montaje).
  const [buffer] = useState(() => new HidScanBuffer())
  const [status, setStatus] = useState<ReaderStatus>('ready')
  const receivedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Callback siempre fresco sin re-registrar el listener global.
  const onScanRef = useRef(onScan)
  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  const focusCapture = useCallback(() => {
    if (!focusActive || disabled) return
    const el = inputRef.current
    if (el && document.activeElement !== el) el.focus({ preventScroll: true })
  }, [focusActive, disabled])

  // ── Captura global: la ráfaga del lector se procesa sin importar el foco ──
  useEffect(() => {
    if (disabled) return

    function onKeyDown(e: KeyboardEvent) {
      // Atajos con modificador (Alt+C / Alt+L…) no son parte de un código.
      if (e.altKey || e.ctrlKey || e.metaKey) return

      const target = e.target as HTMLElement | null
      const esNuestro = target === inputRef.current
      // No interferir cuando el usuario escribe en un control REAL (búsquedas,
      // notas, selects): ahí las teclas son suyas, no del lector.
      const esEditable =
        !esNuestro &&
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (esEditable) return

      // Enter/Tab: evita submits o activar el botón enfocado cuando cierran
      // una ráfaga en curso (o cualquier tecla dentro del campo de captura).
      if ((e.key === 'Enter' || e.key === 'Tab') && (esNuestro || buffer.length > 0)) {
        e.preventDefault()
      }

      const res = buffer.push(e.key, e.timeStamp)
      if (res) {
        setStatus('received')
        if (receivedTimer.current) clearTimeout(receivedTimer.current)
        receivedTimer.current = setTimeout(() => setStatus('ready'), 900)
        onScanRef.current(res.code, res.fromReader)
      } else if (buffer.length > 0) {
        setStatus('listening')
      }
    }

    // Fase captura: se procesa antes de que cualquier control lo consuma.
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [disabled, buffer])

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
    if (!focusActive || disabled) return
    const t = setTimeout(() => {
      buffer.reset()
      setStatus('ready')
      focusCapture()
    }, 50)
    return () => clearTimeout(t)
  }, [focusActive, disabled, focusCapture, buffer])

  useEffect(() => {
    return () => {
      if (receivedTimer.current) clearTimeout(receivedTimer.current)
    }
  }, [])

  return { inputRef, status, focusCapture, handleBlur }
}
