'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Share2, Download, ShieldCheck, Clock, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { compartirQrToken } from '@/modules/cliente/qrActions'

interface QRShareCardProps {
  qrTokenId: string
  token: string
  companyName: string
  /** Días que le quedan a la membresía. null = sin fecha de vencimiento. */
  diasRestantes: number | null
  esIlimitado: boolean
  lavadosRestantes: number
  /** Estado inicial del contador de compartidos (viene del servidor). */
  compartidoCount: number
  ultimoCompartidoISO: string | null
}

/** Texto explícito de vigencia para mostrar y para incrustar en la imagen. */
function vigenciaLabel(dias: number | null): { texto: string; urgente: boolean } {
  if (dias === null) return { texto: 'Sin vencimiento', urgente: false }
  if (dias < 0) return { texto: 'Membresía vencida', urgente: true }
  if (dias === 0) return { texto: 'Vence hoy', urgente: true }
  if (dias === 1) return { texto: 'Te queda 1 día', urgente: true }
  return { texto: `Te quedan ${dias} días`, urgente: dias <= 7 }
}

/**
 * Tarjeta del QR con opción de compartir (WhatsApp / compartir nativo).
 *
 * - El QR sigue siendo de un solo uso: compartir la imagen no crea un token
 *   nuevo; quien lo escanee primero lo consume y se regenera.
 * - Al compartir se registra en el historial (audit log) con la fecha.
 * - La imagen que se comparte lleva incrustados, de forma bien visible, los
 *   días que le quedan al cliente.
 */
export function QRShareCard({
  qrTokenId,
  token,
  companyName,
  diasRestantes,
  esIlimitado,
  lavadosRestantes,
  compartidoCount,
  ultimoCompartidoISO,
}: QRShareCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [count, setCount] = useState(compartidoCount)
  const [ultimo, setUltimo] = useState<string | null>(ultimoCompartidoISO)
  const shareFileRef = useRef<File | null>(null)

  const vigencia = vigenciaLabel(diasRestantes)
  const size = 240

  // QR simple para mostrar en pantalla.
  useEffect(() => {
    let active = true
    QRCode.toDataURL(token, {
      width: size * 2,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setDataUrl(url)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [token])

  /** Compone una imagen (QR + empresa + días restantes) lista para compartir. */
  const buildShareImage = useCallback(async (): Promise<Blob | null> => {
    try {
      const W = 640
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = 820
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Fondo
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, canvas.height)

      // Empresa
      ctx.fillStyle = '#0f172a'
      ctx.textAlign = 'center'
      ctx.font = 'bold 40px system-ui, -apple-system, Segoe UI, sans-serif'
      ctx.fillText(companyName.slice(0, 26), W / 2, 90)

      ctx.fillStyle = '#64748b'
      ctx.font = '26px system-ui, -apple-system, Segoe UI, sans-serif'
      ctx.fillText('Membresía digital', W / 2, 132)

      // QR
      const qrSize = 420
      const qrUrl = await QRCode.toDataURL(token, {
        width: qrSize * 2,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = qrUrl
      })
      const qrX = (W - qrSize) / 2
      ctx.drawImage(img, qrX, 176, qrSize, qrSize)

      // Badge de días restantes (bien explícito)
      const badgeY = 176 + qrSize + 44
      ctx.fillStyle = vigencia.urgente ? '#b91c1c' : '#1d4ed8'
      ctx.font = 'bold 46px system-ui, -apple-system, Segoe UI, sans-serif'
      ctx.fillText(vigencia.texto, W / 2, badgeY)

      // Usos restantes
      ctx.fillStyle = '#334155'
      ctx.font = '28px system-ui, -apple-system, Segoe UI, sans-serif'
      const usos = esIlimitado
        ? 'Usos ilimitados'
        : `${lavadosRestantes} uso${lavadosRestantes !== 1 ? 's' : ''} restante${lavadosRestantes !== 1 ? 's' : ''}`
      ctx.fillText(usos, W / 2, badgeY + 46)

      // Pie
      ctx.fillStyle = '#94a3b8'
      ctx.font = '24px system-ui, -apple-system, Segoe UI, sans-serif'
      ctx.fillText('Válido para un solo uso · MembeGo', W / 2, badgeY + 96)

      return await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png', 0.95)
      )
    } catch {
      return null
    }
  }, [token, companyName, vigencia.texto, vigencia.urgente, esIlimitado, lavadosRestantes])

  /** Registra el envío en el historial y refresca los contadores locales. */
  const registrarCompartido = useCallback(async () => {
    const res = await compartirQrToken(qrTokenId)
    if (res.success) {
      setCount(res.compartidoCount ?? count + 1)
      setUltimo(res.compartidoEn ?? new Date().toISOString())
    } else if (res.error) {
      // No bloquea el compartir; solo avisa que no quedó registrado.
      toast.error(res.error)
    }
  }, [qrTokenId, count])

  const handleShare = useCallback(async () => {
    setSharing(true)
    try {
      const blob = shareFileRef.current
        ? null
        : await buildShareImage()
      const file =
        shareFileRef.current ??
        (blob ? new File([blob], 'mi-qr-membresia.png', { type: 'image/png' }) : null)
      if (file) shareFileRef.current = file

      const texto = `Mi QR de membresía de ${companyName} · ${vigencia.texto}. Válido para un solo uso.`

      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean
      }

      // 1) Compartir nativo con la imagen (incluye WhatsApp en móvil).
      if (
        file &&
        typeof nav.share === 'function' &&
        nav.canShare?.({ files: [file] })
      ) {
        try {
          await nav.share({
            files: [file],
            title: `QR de ${companyName}`,
            text: texto,
          })
          await registrarCompartido()
          toast.success('QR compartido. Quedó registrado en tu historial.')
          return
        } catch (err) {
          // El usuario canceló el diálogo: no es un error.
          if (err instanceof DOMException && err.name === 'AbortError') return
          // Si falla el compartir de archivos, caemos a WhatsApp por texto.
        }
      }

      // 2) Fallback: descargar la imagen y abrir WhatsApp con el mensaje.
      if (file) {
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mi-qr-membresia.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 4000)
      }
      window.open(
        `https://wa.me/?text=${encodeURIComponent(texto)}`,
        '_blank',
        'noopener,noreferrer'
      )
      await registrarCompartido()
      toast.success('Guardamos tu QR y abrimos WhatsApp. Adjunta la imagen descargada.')
    } finally {
      setSharing(false)
    }
  }, [buildShareImage, companyName, vigencia.texto, registrarCompartido])

  const handleDownload = useCallback(async () => {
    const blob = await buildShareImage()
    if (!blob) {
      toast.error('No se pudo generar la imagen.')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mi-qr-membresia.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    toast.success('QR descargado.')
  }, [buildShareImage])

  return (
    <div className="mb-8 flex flex-col items-center rounded-2xl border border-border/60 bg-card px-6 py-8 text-center shadow-card">
      <h2 className="text-h2 text-foreground">Tu código QR</h2>
      <p className="mt-1 max-w-sm text-small text-muted-foreground">
        Muéstralo en {companyName} para validar tu membresía al instante.
      </p>

      {/* Días restantes: bien explícito, encima del QR */}
      <div
        className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
          vigencia.urgente
            ? 'bg-red-100 text-red-700'
            : 'bg-blue-100 text-blue-700'
        }`}
      >
        <Clock className="h-4 w-4" />
        {vigencia.texto}
      </div>

      {/* QR */}
      <div className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-600 p-[3px] shadow-premium-lg">
        <div
          className="flex items-center justify-center rounded-3xl bg-white p-4"
          style={{ width: size + 32, height: size + 32 }}
        >
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="Código QR de membresía"
              width={size}
              height={size}
              className="animate-scale-in"
            />
          ) : (
            <div
              className="skeleton-shimmer rounded-xl"
              style={{ width: size, height: size }}
            />
          )}
        </div>
      </div>

      {/* Acciones: compartir + descargar */}
      <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {sharing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          Compartir por WhatsApp
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Descargar
        </button>
      </div>

      {/* Historial de envíos */}
      {count > 0 && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-caption text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          Compartido {count} {count === 1 ? 'vez' : 'veces'}
          {ultimo && (
            <>
              {' · '}último envío el{' '}
              {format(new Date(ultimo), "d 'de' MMM, HH:mm", { locale: es })}
            </>
          )}
        </p>
      )}

      <p className="mt-3 inline-flex items-center gap-1.5 text-caption">
        <ShieldCheck className="h-3.5 w-3.5" />
        Por seguridad, el código se renueva cada vez que usas tu membresía.
      </p>
    </div>
  )
}
