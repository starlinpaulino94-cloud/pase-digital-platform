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
import { buscarPorToken, type ClienteLookup, type LookupResult, type PromoCompraLookup } from '@/modules/visitas/actions'
import type { TransaccionScanInfo } from '@/modules/transacciones/actions'
import { ConfirmVisit } from '@/components/scanner/ConfirmVisit'
import { ConfirmPromo } from '@/components/scanner/ConfirmPromo'
import { TransaccionRecord } from '@/components/scanner/TransaccionRecord'
import { ScannerErrorBoundary } from '@/components/scanner/ScannerErrorBoundary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const QRScanner = dynamic(
  () => import('@/components/scanner/QRScanner').then((m) => m.QRScanner),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto flex h-56 w-full max-w-sm items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
      </div>
    ),
  }
)

interface Sucursal {
  id: string
  nombre: string
}

type ErrorCode = NonNullable<LookupResult['errorCode']>

// Tono del error sobre tokens semánticos (dark-safe): el contenido de cada
// código (título + qué hacer) viene del diagnóstico del servidor.
const TONE = {
  destructive: {
    box: 'border-destructive/25 bg-destructive/10',
    icon: 'text-destructive',
    title: 'text-destructive',
  },
  warning: {
    box: 'border-warning/30 bg-warning/10',
    icon: 'text-warning-foreground',
    title: 'text-warning-foreground',
  },
  muted: {
    box: 'border-border bg-muted/50',
    icon: 'text-muted-foreground',
    title: 'text-foreground',
  },
} as const

const ERROR_CONFIG: Record<ErrorCode, { icon: typeof XCircle; title: string; tone: keyof typeof TONE; action: string }> = {
  QR_NOT_FOUND: {
    icon: QrCode,
    title: 'Código QR no encontrado',
    tone: 'destructive',
    action: 'Verifica que el código sea correcto o pide al cliente un QR actualizado.',
  },
  QR_INACTIVE: {
    icon: Ban,
    title: 'Código QR ya utilizado',
    tone: 'warning',
    action: 'Este QR es de un solo uso. Pide al cliente que abra su app para generar uno nuevo.',
  },
  WRONG_COMPANY: {
    icon: Building2,
    title: 'Cliente de otra empresa',
    tone: 'warning',
    action: 'Este cliente pertenece a otra empresa. Verifica que esté en el lugar correcto.',
  },
  NO_MEMBERSHIP: {
    icon: ShieldX,
    title: 'Sin membresía registrada',
    tone: 'muted',
    action: 'El cliente no tiene ninguna membresía. Puede registrarse desde la app.',
  },
  MEMBERSHIP_INACTIVE: {
    icon: AlertTriangle,
    title: 'Membresía no activa',
    tone: 'warning',
    action: 'La membresía está pendiente, cancelada o rechazada. El cliente debe contactar soporte.',
  },
  MEMBERSHIP_EXPIRED: {
    icon: Clock,
    title: 'Membresía vencida',
    tone: 'destructive',
    action: 'La membresía ha expirado. El cliente debe renovar desde la app.',
  },
  NO_USES_LEFT: {
    icon: Ban,
    title: 'Sin usos disponibles',
    tone: 'warning',
    action: 'Se agotaron los usos del período actual. El cliente puede actualizar su plan.',
  },
  RATE_LIMITED: {
    icon: Clock,
    title: 'Demasiadas búsquedas',
    tone: 'warning',
    action: 'Espera unos segundos antes de intentar de nuevo.',
  },
  UNAUTHORIZED: {
    icon: ShieldX,
    title: 'Acceso no autorizado',
    tone: 'destructive',
    action: 'No tienes permisos para escanear. Contacta al administrador.',
  },
  INTERNAL: {
    icon: ServerCrash,
    title: 'Error del servidor',
    tone: 'destructive',
    action: 'Ocurrió un error interno. Intenta de nuevo en unos segundos.',
  },
}

function ErrorScreen({
  errorCode,
  errorMessage,
  onScanNext,
  onClose,
}: {
  errorCode: ErrorCode | null
  errorMessage: string
  onScanNext: () => void
  onClose: () => void
}) {
  const config = errorCode ? ERROR_CONFIG[errorCode] : ERROR_CONFIG.INTERNAL
  const tone = TONE[config.tone]
  const Icon = config.icon

  return (
    <div className={`animate-scale-in space-y-4 rounded-2xl border p-6 text-center ${tone.box}`}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-premium">
        <Icon className={`h-7 w-7 ${tone.icon}`} />
      </div>
      <div>
        <h3 className={`text-lg font-bold tracking-tight ${tone.title}`}>{config.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
      </div>
      <p className="text-sm text-foreground/80">{config.action}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={onScanNext} size="lg" className="gap-2">
          <ScanLine className="h-4 w-4" />
          Escanear siguiente
        </Button>
        <Button onClick={onClose} variant="outline" size="lg" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}

export function ScannerClient({ sucursales = [] }: { sucursales?: Sucursal[] }) {
  const [scanning, setScanning] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState('')
  const [cliente, setCliente] = useState<ClienteLookup | null>(null)
  // Fase E5: QR de una promoción comprada (canje).
  const [promoCompra, setPromoCompra] = useState<PromoCompraLookup | null>(null)
  // Fase E4: registro de una transacción (QR de ticket TX-… o QR ya usado).
  const [txRecord, setTxRecord] = useState<{ info: TransaccionScanInfo; esQrUsado: boolean } | null>(null)
  const [errorState, setErrorState] = useState<{ message: string; code: ErrorCode | null } | null>(null)
  const [pending, startTransition] = useTransition()

  const lookup = useCallback((token: string) => {
    setErrorState(null)
    setScanning(false)
    startTransition(async () => {
      try {
        const res = await buscarPorToken(token)
        if (res.transaccion) {
          // Historial de la operación: QR impreso en el ticket, o QR de
          // cliente ya consumido (se muestra el registro, no un error seco).
          setTxRecord({ info: res.transaccion, esQrUsado: res.errorCode === 'QR_INACTIVE' })
        } else if (res.promoCompra) {
          setPromoCompra(res.promoCompra)
        } else if (res.error) {
          setErrorState({ message: res.error, code: res.errorCode ?? null })
        } else if (res.cliente) {
          setCliente(res.cliente)
        } else {
          setErrorState({ message: 'Respuesta vacía del servidor.', code: 'INTERNAL' })
        }
      } catch (err) {
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
    setPromoCompra(null)
    setTxRecord(null)
    setErrorState(null)
    setManual('')
    setScanning(false)
    setShowManual(false)
  }

  // Loop sin fricción: tras un resultado (éxito o error), vuelve DIRECTO a la
  // cámara sin pasar por la pantalla fría ni el tap extra en "Abrir cámara".
  const scanNext = useCallback(() => {
    setCliente(null)
    setPromoCompra(null)
    setTxRecord(null)
    setErrorState(null)
    setManual('')
    setShowManual(false)
    setScanning(true)
  }, [])

  const openManual = useCallback(() => {
    setScanning(false)
    setShowManual(true)
  }, [])

  if (txRecord) {
    return (
      <ScannerErrorBoundary onReset={reset}>
        <Card className="border-border/60 shadow-card-hover animate-scale-in">
          <CardContent className="p-6">
            <TransaccionRecord
              transaccion={txRecord.info}
              esQrUsado={txRecord.esQrUsado}
              onScanNext={scanNext}
              onClose={reset}
            />
          </CardContent>
        </Card>
      </ScannerErrorBoundary>
    )
  }

  if (promoCompra) {
    return (
      <ScannerErrorBoundary onReset={reset}>
        <Card className="border-border/60 shadow-card-hover animate-scale-in">
          <CardContent className="p-6">
            <ConfirmPromo
              compra={promoCompra}
              sucursales={sucursales}
              onDone={reset}
              onScanNext={scanNext}
            />
          </CardContent>
        </Card>
      </ScannerErrorBoundary>
    )
  }

  if (cliente) {
    return (
      <ScannerErrorBoundary onReset={reset}>
        <Card className="border-border/60 shadow-card-hover animate-scale-in">
          <CardContent className="p-6">
            <ConfirmVisit
              cliente={cliente}
              sucursales={sucursales}
              onDone={reset}
              onScanNext={scanNext}
            />
          </CardContent>
        </Card>
      </ScannerErrorBoundary>
    )
  }

  // Estado dedicado mientras el servidor valida el QR: antes el spinner
  // aparecía dentro del botón "Abrir cámara" y se leía como un glitch.
  if (pending) {
    return (
      <Card className="overflow-hidden rounded-3xl border-border/60 py-0 shadow-premium animate-fade-in">
        <div className="relative bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-40" />
          <div className="relative space-y-4">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Verificando cliente…</h2>
              <p className="mt-1 text-sm text-white/60">Consultando la membresía y sus beneficios</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {errorState && (
        <ErrorScreen
          errorCode={errorState.code}
          errorMessage={errorState.message}
          onScanNext={scanNext}
          onClose={reset}
        />
      )}

      {/* Camera scanner */}
      <Card className="overflow-hidden rounded-3xl border-border/60 py-0 shadow-premium">
        <div className="relative bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 p-7 text-center sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-40" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

          <div className="relative">
            {!scanning && (
              <>
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                  <ScanLine className="h-7 w-7 text-primary" />
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white">Escanear QR</h2>
                <p className="mt-1 text-sm text-white/60">
                  Apunta la cámara al código QR del cliente
                </p>
              </>
            )}

            {scanning ? (
              <div className="space-y-4">
                <QRScanner onScan={lookup} onRequestManual={openManual} />
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setScanning(false)}
                >
                  Detener cámara
                </Button>
              </div>
            ) : (
              <Button
                className="mt-6 w-full font-semibold shadow-glow sm:w-auto sm:px-10"
                onClick={() => setScanning(true)}
                size="xl"
              >
                Abrir cámara
              </Button>
            )}
          </div>
        </div>

        {/* Manual entry toggle */}
        <div className="border-t border-border/60 bg-muted/30 px-6 py-4">
          {showManual ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && manual && lookup(manual)}
                  placeholder="Código del cliente…"
                  aria-label="Código del cliente"
                  className="text-sm"
                  autoFocus
                />
                <Button
                  onClick={() => manual && lookup(manual)}
                  disabled={pending || !manual}
                  className="shrink-0"
                >
                  Buscar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                El cliente puede ver este código debajo de su QR, en la sección
                &laquo;Mi membresía&raquo; de su app.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="flex min-h-11 w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
