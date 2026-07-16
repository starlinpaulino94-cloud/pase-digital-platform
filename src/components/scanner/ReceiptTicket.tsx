'use client'

/**
 * Render del comprobante (Receipt Engine, Fase E4) para el canal 'browser':
 * ReceiptDoc → HTML monoespaciado con CSS de impresión 58/80 mm, compatible
 * con térmicas instaladas como impresora del sistema (p. ej. 2Connect
 * POS80-01 V8 vía window.print). El MISMO ReceiptDoc alimenta el encoder
 * ESC/POS cuando se usa un transporte de bytes crudos.
 *
 * El QR del ticket codifica el Transaction ID (TX-…): escanearlo en el panel
 * consulta el historial de esa operación. Nunca es el QR de autenticación.
 */

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { buildReceiptDoc, PAPER_COLS, type ReceiptDoc, type ReceiptLine } from '@/lib/receipts'
import type { TicketPayload } from '@/modules/transacciones/actions'

export function buildDocFromPayload(
  ticket: TicketPayload,
  opts?: { esCopia?: boolean; copiaNumero?: number }
): ReceiptDoc {
  return buildReceiptDoc({
    empresa: ticket.empresa,
    template: ticket.template,
    transaccion: { ...ticket.transaccion, fecha: new Date(ticket.transaccion.fecha) },
    esCopia: opts?.esCopia,
    copiaNumero: opts?.copiaNumero,
    timeZone: ticket.timeZone,
  })
}

const ALIGN_CLASS = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

/**
 * Ticket imprimible. Renderiza oculto en pantalla y visible solo al imprimir
 * (la hoja de estilos aísla `.receipt-print`). El ancho responde al papel
 * configurado en la plantilla de la empresa (58 u 80 mm).
 */
export function ReceiptTicket({
  ticket,
  esCopia = false,
  copiaNumero,
  logoUrl,
}: {
  ticket: TicketPayload
  esCopia?: boolean
  copiaNumero?: number
  logoUrl?: string | null
}) {
  const doc = buildDocFromPayload(ticket, { esCopia, copiaNumero })
  const cols = PAPER_COLS[doc.paperWidthMm]
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({})

  useEffect(() => {
    let cancelled = false
    const jobs = doc.lines
      .map((l, i) => ({ l, i }))
      .filter((x): x is { l: Extract<ReceiptLine, { kind: 'qr' }>; i: number } => x.l.kind === 'qr')
    Promise.all(
      jobs.map(async ({ l, i }) => {
        const url = await QRCode.toDataURL(l.data, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: doc.paperWidthMm === 58 ? 140 : 180,
        })
        return [i, url] as const
      })
    ).then((pairs) => {
      if (!cancelled) setQrUrls(Object.fromEntries(pairs))
    })
    return () => {
      cancelled = true
    }
    // El doc se deriva del payload; las líneas QR solo cambian con el código.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.transaccion.codigo, esCopia, copiaNumero, doc.paperWidthMm])

  return (
    <div className="hidden print:block" aria-hidden>
      <style>{`
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden !important; }
          .receipt-print, .receipt-print * { visibility: visible !important; }
          /* position:absolute (no fixed): fixed recorta el ticket a una sola
             página y los comprobantes largos salían cortados. */
          .receipt-print {
            position: absolute; top: 0; left: 0;
            width: ${doc.paperWidthMm}mm;
            padding: 2mm 3mm;
          }
          html, body { height: auto !important; overflow: visible !important; }
        }
      `}</style>
      <div
        className="receipt-print mx-auto bg-white font-mono text-black"
        style={{ width: `${doc.paperWidthMm}mm`, fontSize: doc.paperWidthMm === 58 ? '10px' : '12px', lineHeight: 1.45 }}
      >
        {doc.lines.map((line, i) => {
          switch (line.kind) {
            case 'text':
              return (
                <div
                  key={i}
                  className={`${ALIGN_CLASS[line.align ?? 'left']} ${line.bold ? 'font-bold' : ''} break-words`}
                  style={line.size === 'double' ? { fontSize: '1.45em' } : undefined}
                >
                  {line.text}
                </div>
              )
            case 'pair':
              return (
                <div key={i} className="flex justify-between gap-2">
                  <span className="shrink-0">{line.label}:</span>
                  <span className={`text-right break-all ${line.boldValue ? 'font-bold' : ''}`}>
                    {line.value}
                  </span>
                </div>
              )
            case 'separator':
              return (
                <div key={i} className="overflow-hidden whitespace-nowrap" style={{ letterSpacing: '0.5px' }}>
                  {(line.char ?? '-').repeat(cols)}
                </div>
              )
            case 'qr':
              return (
                <div key={i} className="my-1 text-center">
                  {qrUrls[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrUrls[i]}
                      alt={`QR ${line.data}`}
                      className="mx-auto"
                      style={{ width: doc.paperWidthMm === 58 ? '26mm' : '32mm' }}
                    />
                  ) : (
                    <div className="font-bold">{line.data}</div>
                  )}
                  {line.caption && <div className="text-[0.85em]">{line.caption}</div>}
                </div>
              )
            case 'logo':
              return logoUrl ? (
                <div key={i} className="mb-1 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="" className="mx-auto max-h-14 object-contain grayscale" />
                </div>
              ) : null
            case 'feed':
              return <div key={i} style={{ height: `${(line.lines ?? 1) * 0.9}em` }} />
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}
