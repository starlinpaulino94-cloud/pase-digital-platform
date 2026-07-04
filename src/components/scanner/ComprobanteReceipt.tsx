'use client'

import { useEffect, useRef } from 'react'
import {
  Printer,
  CheckCircle2,
  Share2,
  ArrowRight,
  User,
  Building2,
  CreditCard,
  Calendar,
  Clock,
  Sparkles,
  Gift,
  Shield,
  Hash,
} from 'lucide-react'
import { registrarImpresion } from '@/modules/visitas/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ClienteLookup } from '@/modules/visitas/actions'

interface Props {
  cliente: ClienteLookup
  visitId: string
  servicio: string
  restantes: number
  onDone: () => void
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'long' }).format(d)
}

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { timeStyle: 'short' }).format(d)
}

function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: typeof User }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-50">
        <Icon className="h-3.5 w-3.5 text-green-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function ComprobanteReceipt({ cliente, visitId, servicio, restantes, onDone }: Props) {
  const hasLogged = useRef(false)
  const codigoOperacion = `MBRGO-${visitId.slice(-8).toUpperCase()}`
  const now = new Date()

  useEffect(() => {
    if (!hasLogged.current) {
      hasLogged.current = true
      registrarImpresion(visitId).catch(() => {})
    }
  }, [visitId])

  function handlePrint() {
    window.print()
  }

  async function handleShare() {
    const text = [
      `✓ Visita confirmada — ${cliente.empresa}`,
      `Cliente: ${cliente.nombre}`,
      `Servicio: ${servicio}`,
      `Código: ${codigoOperacion}`,
      `Fecha: ${fmtDateTime(now)}`,
    ].join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Comprobante de visita', text })
        return
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <>
      {/* Screen view */}
      <div className="print:hidden space-y-5">
        {/* Success header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Uso registrado correctamente</h3>
          <p className="mt-1 text-sm text-muted-foreground">{fmtDateTime(now)}</p>
        </div>

        {/* Receipt card */}
        <div className="rounded-xl border-2 border-green-200 bg-white p-4 space-y-0.5">
          <InfoRow label="Cliente" value={cliente.nombre} icon={User} />
          <InfoRow label="Empresa" value={cliente.empresa} icon={Building2} />
          <InfoRow label="Plan" value={cliente.planNombre ?? 'Sin plan'} icon={CreditCard} />
          <InfoRow label="Servicio utilizado" value={servicio} icon={Gift} />
          <InfoRow label="Fecha" value={fmtDate(now)} icon={Calendar} />
          <InfoRow label="Hora" value={fmtTime(now)} icon={Clock} />
          <InfoRow label="Código de operación" value={codigoOperacion} icon={Hash} />
          <InfoRow
            label="Usos restantes"
            value={cliente.esIlimitado ? 'Ilimitado' : String(restantes)}
            icon={cliente.esIlimitado ? Sparkles : Shield}
          />
        </div>

        {/* Status badge */}
        <div className="flex justify-center">
          <Badge className="bg-green-100 text-green-700 text-xs px-3 py-1">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            QR validado y registrado
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-col gap-1 h-auto py-3"
          >
            <Printer className="h-5 w-5" />
            <span className="text-xs">Imprimir</span>
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-col gap-1 h-auto py-3"
          >
            <Share2 className="h-5 w-5" />
            <span className="text-xs">Compartir</span>
          </Button>
          <Button
            onClick={onDone}
            className="flex-col gap-1 h-auto py-3 bg-green-600 hover:bg-green-500 text-white"
          >
            <ArrowRight className="h-5 w-5" />
            <span className="text-xs">Finalizar</span>
          </Button>
        </div>
      </div>

      {/* Printable receipt */}
      <div className="hidden print:block">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .receipt-print, .receipt-print * { visibility: visible !important; }
            .receipt-print { position: fixed; top: 0; left: 0; width: 80mm; }
          }
        `}</style>
        <div
          className="receipt-print mx-auto font-mono text-black"
          style={{ width: '80mm', fontSize: '12px', lineHeight: '1.5' }}
        >
          <div className="text-center border-b border-black pb-2 mb-3">
            <p className="font-bold text-base">{cliente.empresa}</p>
            <p className="text-xs">COMPROBANTE DE VISITA</p>
          </div>

          <div className="space-y-1 mb-3">
            <div className="flex justify-between">
              <span>No.:</span>
              <span className="font-bold">{codigoOperacion}</span>
            </div>
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span>{fmtDateTime(now)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black pt-2 mt-2 space-y-1 mb-3">
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="font-bold">{cliente.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span>Plan:</span>
              <span>{cliente.planNombre ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Servicio:</span>
              <span>{servicio}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black pt-2 mt-2 mb-3">
            {cliente.esIlimitado ? (
              <div className="flex justify-between font-bold">
                <span>Usos:</span>
                <span>ILIMITADO</span>
              </div>
            ) : (
              <div className="flex justify-between font-bold">
                <span>Usos restantes:</span>
                <span>{restantes}</span>
              </div>
            )}
          </div>

          <div className="border-t border-black pt-2 text-center text-xs">
            <p>Gracias por tu preferencia.</p>
            <p className="mt-1 text-[10px] text-gray-500">
              Ref: {visitId.slice(-12).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
