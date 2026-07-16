'use client'

/**
 * Vista previa + impresión/reimpresión de una factura.
 *
 * El usuario elige el formato (térmica 58 mm, térmica 80 mm, Carta o A4), ve
 * la factura EXACTAMENTE como saldrá y recién entonces imprime. Cada
 * impresión queda registrada (original / COPIA #N) y auditada. Reutiliza el
 * documento original: nunca genera una factura nueva.
 */

import { useEffect, useState } from 'react'
import { Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import {
  obtenerTicket,
  registrarImpresionTx,
  type TicketPayload,
} from '@/modules/transacciones/actions'
import { buildDocFromPayload } from '@/components/scanner/ReceiptTicket'
import { FacturaSheet } from '@/components/facturas/FacturaSheet'
import { PAPER_COLS, type ReceiptLine } from '@/lib/receipts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@membego/ui/cn'
import QRCode from 'qrcode'

type Formato = '58' | '80' | 'carta' | 'a4'

const FORMATOS: { value: Formato; label: string }[] = [
  { value: '58', label: 'Térmica 58 mm' },
  { value: '80', label: 'Térmica 80 mm' },
  { value: 'carta', label: 'Carta' },
  { value: 'a4', label: 'A4' },
]

/** Render visible del ticket térmico (misma fuente de verdad que ReceiptTicket). */
function TicketPreview({ ticket, widthMm, esCopia }: { ticket: TicketPayload; widthMm: 58 | 80; esCopia: boolean }) {
  const doc = buildDocFromPayload(
    { ...ticket, template: { ...ticket.template, paperWidthMm: widthMm } },
    { esCopia }
  )
  const cols = PAPER_COLS[doc.paperWidthMm]
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({})

  useEffect(() => {
    let cancelled = false
    const jobs = doc.lines
      .map((l, i) => ({ l, i }))
      .filter((x): x is { l: Extract<ReceiptLine, { kind: 'qr' }>; i: number } => x.l.kind === 'qr')
    Promise.all(
      jobs.map(async ({ l, i }) => [i, await QRCode.toDataURL(l.data, { margin: 1, width: 160 })] as const)
    ).then((pairs) => {
      if (!cancelled) setQrUrls(Object.fromEntries(pairs))
    })
    return () => {
      cancelled = true
    }
    // Las líneas QR dependen solo del código y del ancho de papel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.transaccion.codigo, widthMm, esCopia])

  const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

  return (
    <div
      className="mx-auto bg-white font-mono text-black shadow"
      style={{ width: `${doc.paperWidthMm}mm`, fontSize: doc.paperWidthMm === 58 ? '10px' : '12px', lineHeight: 1.45, padding: '2mm 3mm' }}
    >
      {doc.lines.map((line, i) => {
        switch (line.kind) {
          case 'text':
            return (
              <div key={i} className={`${ALIGN[line.align ?? 'left']} ${line.bold ? 'font-bold' : ''} break-words`} style={line.size === 'double' ? { fontSize: '1.45em' } : undefined}>
                {line.text}
              </div>
            )
          case 'pair':
            return (
              <div key={i} className="flex justify-between gap-2">
                <span className="shrink-0">{line.label}:</span>
                <span className={`text-right break-all ${line.boldValue ? 'font-bold' : ''}`}>{line.value}</span>
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
                  <img src={qrUrls[i]} alt={`QR ${line.data}`} className="mx-auto" style={{ width: doc.paperWidthMm === 58 ? '26mm' : '32mm' }} />
                ) : (
                  <div className="font-bold">{line.data}</div>
                )}
                {line.caption && <div className="text-[0.85em]">{line.caption}</div>}
              </div>
            )
          case 'logo':
            return ticket.empresa.logoUrl ? (
              <div key={i} className="mb-1 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ticket.empresa.logoUrl} alt="" className="mx-auto max-h-14 object-contain grayscale" />
              </div>
            ) : null
          case 'feed':
            return <div key={i} style={{ height: `${(line.lines ?? 1) * 0.9}em` }} />
          default:
            return null
        }
      })}
    </div>
  )
}

export function FacturaPrintDialog({
  transactionId,
  yaImpresa,
  triggerLabel = 'Ver / imprimir',
}: {
  transactionId: string
  /** true = ya tiene impresión original → la siguiente es COPIA. */
  yaImpresa: boolean
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [ticket, setTicket] = useState<TicketPayload | null>(null)
  const [cargando, setCargando] = useState(false)
  const [formato, setFormato] = useState<Formato>('80')
  const [imprimiendo, setImprimiendo] = useState(false)

  function abrir(siguiente: boolean) {
    setOpen(siguiente)
    if (!siguiente || ticket || cargando) return
    setCargando(true)
    obtenerTicket(transactionId)
      .then((res) => {
        if (res.ticket) setTicket(res.ticket)
        else toast.error(res.error ?? 'No se pudo cargar la factura.')
      })
      .finally(() => setCargando(false))
  }

  async function imprimir() {
    if (!ticket) return
    setImprimiendo(true)
    try {
      await registrarImpresionTx(transactionId, yaImpresa ? 'Reimpresión desde historial' : undefined)
      // La hoja de estilos del diálogo aísla .factura-print para imprimir
      // exactamente lo que muestra la vista previa.
      window.print()
    } finally {
      setImprimiendo(false)
    }
  }

  const esHoja = formato === 'carta' || formato === 'a4'

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Printer className="h-3.5 w-3.5" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vista previa de la factura</DialogTitle>
        </DialogHeader>

        {/* Selector de formato */}
        <div className="flex flex-wrap gap-2">
          {FORMATOS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormato(f.value)}
              aria-pressed={formato === f.value}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                formato === f.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Vista previa (idéntica a la impresión) */}
        <div className="max-h-[52vh] overflow-auto rounded-xl border border-border bg-muted/40 p-4">
          {cargando || !ticket ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando factura…
            </div>
          ) : esHoja ? (
            <div className="mx-auto max-w-[210mm] shadow">
              <FacturaSheet ticket={ticket} esCopia={yaImpresa} />
            </div>
          ) : (
            <TicketPreview ticket={ticket} widthMm={formato === '58' ? 58 : 80} esCopia={yaImpresa} />
          )}
        </div>

        <Button onClick={imprimir} disabled={!ticket || imprimiendo} className="w-full gap-2 py-5 font-semibold">
          {imprimiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          Imprimir {yaImpresa ? '(copia)' : ''}
        </Button>

        {/* Copia OCULTA solo-impresión con el formato elegido */}
        {ticket && (
          <div className="factura-print hidden" aria-hidden>
            <style>{`
              @media print {
                @page { margin: ${esHoja ? '12mm' : '0'}; ${formato === 'a4' ? 'size: A4;' : formato === 'carta' ? 'size: letter;' : ''} }
                body * { visibility: hidden !important; }
                .factura-print, .factura-print * { visibility: visible !important; }
                .factura-print {
                  display: block !important;
                  position: absolute; top: 0; left: 0;
                  width: ${esHoja ? '100%' : formato === '58' ? '58mm' : '80mm'};
                }
                html, body { height: auto !important; overflow: visible !important; }
              }
            `}</style>
            {esHoja ? (
              <FacturaSheet ticket={ticket} esCopia={yaImpresa} />
            ) : (
              <TicketPreview ticket={ticket} widthMm={formato === '58' ? 58 : 80} esCopia={yaImpresa} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
