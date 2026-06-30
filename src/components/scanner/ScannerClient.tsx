'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, ScanLine, Keyboard } from 'lucide-react'
import { buscarPorToken, type ClienteLookup } from '@/modules/visitas/actions'
import { ConfirmVisit } from '@/components/scanner/ConfirmVisit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

const QRScanner = dynamic(
  () => import('@/components/scanner/QRScanner').then((m) => m.QRScanner),
  { ssr: false, loading: () => <p className="text-center text-slate-400 text-sm">Cargando cámara...</p> }
)

interface Sucursal {
  id: string
  nombre: string
}

export function ScannerClient({ sucursales = [] }: { sucursales?: Sucursal[] }) {
  const [scanning, setScanning] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState('')
  const [cliente, setCliente] = useState<ClienteLookup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function lookup(token: string) {
    setError(null)
    setScanning(false)
    startTransition(async () => {
      const res = await buscarPorToken(token)
      if (res.error) {
        setError(res.error)
      } else if (res.cliente) {
        setCliente(res.cliente)
      }
    })
  }

  function reset() {
    setCliente(null)
    setError(null)
    setManual('')
    setScanning(false)
    setShowManual(false)
  }

  if (cliente) {
    return (
      <Card className="border-border/60 shadow-card-hover animate-scale-in">
        <CardContent className="p-6">
          <ConfirmVisit cliente={cliente} sucursales={sucursales} onDone={reset} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Camera scanner */}
      <Card className="overflow-hidden border-border/60">
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-6 text-center">
          <ScanLine className="mx-auto mb-4 h-10 w-10 text-sky-400" />
          <h2 className="text-lg font-bold text-white">Escanear QR</h2>
          <p className="mt-1 text-sm text-slate-400">
            Apunta la cámara al código QR del cliente
          </p>

          {scanning ? (
            <div className="mt-5">
              <QRScanner onScan={lookup} />
              <Button
                variant="outline"
                className="mt-4 border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setScanning(false)}
              >
                Detener cámara
              </Button>
            </div>
          ) : (
            <Button
              className="mt-5 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8"
              onClick={() => setScanning(true)}
              disabled={pending}
              size="lg"
            >
              {pending
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : 'Abrir cámara'
              }
            </Button>
          )}
        </div>

        {/* Manual entry toggle */}
        <div className="border-t border-border/60 bg-muted/30 px-6 py-4">
          {showManual ? (
            <div className="flex gap-2">
              <Input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && manual && lookup(manual)}
                placeholder="Ingresa el token manualmente..."
                className="text-sm"
                autoFocus
              />
              <Button
                onClick={() => manual && lookup(manual)}
                disabled={pending || !manual}
                className="shrink-0"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Keyboard className="h-4 w-4" />
              Ingresar código manualmente
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
