'use client'

import { useCallback, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import {
  Loader2,
  ScanLine,
  Keyboard,
  XCircle,
  AlertTriangle,
  ShieldX,
  Ban,
  Clock,
  ServerCrash,
  RefreshCw,
  QrCode,
  Building2,
} from 'lucide-react'
import { buscarPorToken, type ClienteLookup, type LookupResult } from '@/modules/visitas/actions'
import { ConfirmVisit } from '@/components/scanner/ConfirmVisit'
import { ScannerErrorBoundary } from '@/components/scanner/ScannerErrorBoundary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const QRScanner = dynamic(
  () => import('@/components/scanner/QRScanner').then((m) => m.QRScanner),
  { ssr: false, loading: () => <p className="text-center text-slate-400 text-sm">Cargando cámara...</p> }
)

interface Sucursal {
  id: string
  nombre: string
}

type ErrorCode = NonNullable<LookupResult['errorCode']>

const ERROR_CONFIG: Record<ErrorCode, { icon: typeof XCircle; title: string; color: string; bgColor: string; action: string }> = {
  QR_NOT_FOUND: {
    icon: QrCode,
    title: 'Código QR no encontrado',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    action: 'Verifica que el código sea correcto o pide al cliente un QR actualizado.',
  },
  QR_INACTIVE: {
    icon: Ban,
    title: 'Código QR ya utilizado',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    action: 'Este QR es de un solo uso. Pide al cliente que abra su app para generar uno nuevo.',
  },
  WRONG_COMPANY: {
    icon: Building2,
    title: 'Cliente de otra empresa',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    action: 'Este cliente pertenece a otra empresa. Verifica que esté en el lugar correcto.',
  },
  NO_MEMBERSHIP: {
    icon: ShieldX,
    title: 'Sin membresía registrada',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 border-slate-200',
    action: 'El cliente no tiene ninguna membresía. Puede registrarse desde la app.',
  },
  MEMBERSHIP_INACTIVE: {
    icon: AlertTriangle,
    title: 'Membresía no activa',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    action: 'La membresía está pendiente, cancelada o rechazada. El cliente debe contactar soporte.',
  },
  MEMBERSHIP_EXPIRED: {
    icon: Clock,
    title: 'Membresía vencida',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    action: 'La membresía ha expirado. El cliente debe renovar desde la app.',
  },
  NO_USES_LEFT: {
    icon: Ban,
    title: 'Sin usos disponibles',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    action: 'Se agotaron los usos del período actual. El cliente puede actualizar su plan.',
  },
  RATE_LIMITED: {
    icon: Clock,
    title: 'Demasiadas búsquedas',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    action: 'Espera unos segundos antes de intentar de nuevo.',
  },
  UNAUTHORIZED: {
    icon: ShieldX,
    title: 'Acceso no autorizado',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    action: 'No tienes permisos para escanear. Contacta al administrador.',
  },
  INTERNAL: {
    icon: ServerCrash,
    title: 'Error del servidor',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    action: 'Ocurrió un error interno. Intenta de nuevo en unos segundos.',
  },
}

function ErrorScreen({
  errorCode,
  errorMessage,
  onRetry,
}: {
  errorCode: ErrorCode | null
  errorMessage: string
  onRetry: () => void
}) {
  const config = errorCode ? ERROR_CONFIG[errorCode] : ERROR_CONFIG.INTERNAL
  const Icon = config.icon

  return (
    <div className={`rounded-xl border p-6 text-center space-y-4 ${config.bgColor}`}>
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm`}>
        <Icon className={`h-7 w-7 ${config.color}`} />
      </div>
      <div>
        <h3 className={`text-lg font-bold ${config.color}`}>{config.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
      </div>
      <p className="text-sm text-foreground/80">{config.action}</p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Escanear otro QR
      </Button>
    </div>
  )
}

export function ScannerClient({ sucursales = [] }: { sucursales?: Sucursal[] }) {
  const [scanning, setScanning] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState('')
  const [cliente, setCliente] = useState<ClienteLookup | null>(null)
  const [errorState, setErrorState] = useState<{ message: string; code: ErrorCode | null } | null>(null)
  const [pending, startTransition] = useTransition()

  const lookup = useCallback((token: string) => {
    setErrorState(null)
    setScanning(false)
    startTransition(async () => {
      try {
        const res = await buscarPorToken(token)
        if (res.error) {
          setErrorState({ message: res.error, code: res.errorCode ?? null })
        } else if (res.cliente) {
          setCliente(res.cliente)
        } else {
          setErrorState({ message: 'Respuesta vacía del servidor.', code: 'INTERNAL' })
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[scanner] lookup error:', err)
        setErrorState({
          message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
          code: 'INTERNAL',
        })
      }
    })
  }, [startTransition])

  function reset() {
    setCliente(null)
    setErrorState(null)
    setManual('')
    setScanning(false)
    setShowManual(false)
  }

  if (cliente) {
    return (
      <ScannerErrorBoundary onReset={reset}>
        <Card className="border-border/60 shadow-card-hover animate-scale-in">
          <CardContent className="p-6">
            <ConfirmVisit cliente={cliente} sucursales={sucursales} onDone={reset} />
          </CardContent>
        </Card>
      </ScannerErrorBoundary>
    )
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {errorState && (
        <ErrorScreen
          errorCode={errorState.code}
          errorMessage={errorState.message}
          onRetry={reset}
        />
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
