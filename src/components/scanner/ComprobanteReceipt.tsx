'use client'

import { useEffect, useRef } from 'react'
import { Printer, CheckCircle2 } from 'lucide-react'
import { registrarImpresion } from '@/modules/visitas/actions'
import { Button } from '@/components/ui/button'
import type { ClienteLookup } from '@/modules/visitas/actions'

interface Props {
  cliente: ClienteLookup
  visitId: string
  servicio: string
  restantes: number
  onDone: () => void
}

function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export function ComprobanteReceipt({ cliente, visitId, servicio, restantes, onDone }: Props) {
  const hasLogged = useRef(false)
  const receiptNum = `PASE-${visitId.slice(-8).toUpperCase()}`
  const now = new Date()

  useEffect(() => {
    if (!hasLogged.current) {
      hasLogged.current = true
      registrarImpresion(visitId)
    }
  }, [visitId])

  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Screen controls */}
      <div className="print:hidden space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
        <h3 className="text-xl font-bold text-slate-800">¡Visita confirmada!</h3>
        {cliente.esIlimitado ? (
          <p className="text-slate-600">Plan ilimitado — sin descuento.</p>
        ) : (
          <p className="text-slate-600">
            Usos restantes: <strong>{restantes}</strong>
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir comprobante
          </Button>
          <Button onClick={onDone} className="bg-sky-500 hover:bg-sky-400">
            Escanear otro
          </Button>
        </div>
      </div>

      {/* Printable receipt — hidden on screen, shown on print */}
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
              <span className="font-bold">{receiptNum}</span>
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
