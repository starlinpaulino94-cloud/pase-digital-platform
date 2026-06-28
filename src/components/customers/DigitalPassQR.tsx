'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'

interface Props {
  token: string
  size?: number
}

export function DigitalPassQR({ token, size = 240 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    if (!canvasRef.current) return

    QRCode.toCanvas(canvasRef.current, token, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(() => {
      // Fallback: generate data URL
      QRCode.toDataURL(token, { width: size, margin: 2 }).then(setDataUrl)
    })
  }, [token, size])

  function handleDownload() {
    const url = dataUrl || canvasRef.current?.toDataURL('image/png')
    if (!url) return
    const link = document.createElement('a')
    link.download = `pase-digital-${token.slice(0, 8)}.png`
    link.href = url
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="Pase Digital QR" width={size} height={size} />
      ) : (
        <canvas ref={canvasRef} className="rounded-lg border p-2 bg-white" />
      )}
      <Button variant="outline" size="sm" onClick={handleDownload}>
        Descargar QR
      </Button>
    </div>
  )
}
