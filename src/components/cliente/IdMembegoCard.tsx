'use client'

/**
 * Mi ID MembeGo (Regalos P2P · Fase R1): el @código con el que otros usuarios
 * pueden encontrarte para enviarte regalos o transferirte lavados. Copiar,
 * compartir nativo y QR (el QR codifica "@CODIGO"; el flujo de envío lo
 * escanea o se pega a mano en el buscador).
 */

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { Check, Copy, Gift, Share2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function IdMembegoCard({ codigo }: { codigo: string }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const idVisible = `@${codigo}`

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(idVisible, { errorCorrectionLevel: 'M', margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setQrUrl(url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [idVisible])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(idVisible)
      setCopiado(true)
      toast.success('ID copiado.')
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('No se pudo copiar.')
    }
  }

  async function compartir() {
    const texto = `Mi ID en MembeGo es ${idVisible} — úsalo para enviarme un regalo 🎁`
    if (navigator.share) {
      try {
        await navigator.share({ text: texto })
        return
      } catch {
        /* cancelado por el usuario */
      }
    } else {
      await navigator.clipboard.writeText(texto).catch(() => {})
      toast.success('Mensaje copiado para compartir.')
    }
  }

  return (
    <Card className="border-primary/25 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-4 w-4 text-primary" />
          Mi ID MembeGo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-5">
          {qrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrUrl}
              alt={`QR de ${idVisible}`}
              className="h-28 w-28 rounded-xl border border-border/70 bg-white p-1"
            />
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <p className="font-mono text-2xl font-bold tracking-widest text-foreground">
              {idVisible}
            </p>
            <p className="text-sm text-muted-foreground">
              Compártelo con tus amigos para que puedan enviarte regalos o
              transferirte sus lavados. Es tu identidad para recibir — nadie
              puede gastar nada con él.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copiar} className="gap-1.5">
                {copiado ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={compartir} className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Compartir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
