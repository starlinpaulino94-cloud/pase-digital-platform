import Link from 'next/link'
import { ChevronLeft, CreditCard, ExternalLink, FileText } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getClienteMembresias } from '@/modules/cliente/queries'
import { EstadoBadge } from '@/components/EstadoBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

function fmtMonto(m: unknown) {
  const n = Number(m)
  if (!n) return '—'
  return `RD$${new Intl.NumberFormat('es-DO').format(n)}`
}

const ESTADO_LABEL: Record<MembershipEstado, string> = {
  PENDIENTE: 'Pendiente de pago',
  PENDIENTE_PAGO: 'Comprobante enviado',
  RECHAZADA: 'Pago rechazado',
  ACTIVA: 'Activo',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
}

export default async function PagosPage() {
  const user = await requireRole('CLIENTE')
  const clienteId = user.metadata.clienteId
  if (!clienteId) return <p>No autorizado.</p>

  const membresias = await getClienteMembresias(clienteId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cliente/dashboard">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de pagos</h1>
          <p className="text-slate-500">Todas tus membresías y su estado de pago</p>
        </div>
      </div>

      {membresias.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Sin historial de pagos</p>
            <p className="text-sm">Selecciona un plan para comenzar.</p>
            <Link href="/cliente/membresia" className="mt-4 block">
              <Button className="bg-sky-500 hover:bg-sky-400">Ver planes</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {membresias.map((m, i) => (
            <Card key={m.id} className={i === 0 ? 'ring-1 ring-sky-200' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base">{m.plan.nombre}</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Solicitado: {fmtDate(m.createdAt)}
                    </p>
                  </div>
                  <EstadoBadge estado={m.estado as MembershipEstado} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-slate-500">Estado pago</p>
                    <p className="font-medium">{ESTADO_LABEL[m.estado as MembershipEstado]}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Monto</p>
                    <p className="font-medium">{fmtMonto(m.montoPagado)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Inicio</p>
                    <p className="font-medium">{fmtDate(m.fechaInicio)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Vencimiento</p>
                    <p className="font-medium">{fmtDate(m.fechaVencimiento)}</p>
                  </div>
                </div>

                {m.metodoPago && (
                  <p className="text-xs text-slate-500">
                    Método de pago: <strong>{m.metodoPago.nombre}</strong>
                  </p>
                )}

                {/* Comprobante */}
                {m.comprobanteUrl && (
                  <a
                    href={m.comprobanteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-sky-600 hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" />
                    Ver comprobante
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {m.comprobanteNota && (
                  <p className="text-xs text-slate-500 italic">
                    Nota: {m.comprobanteNota}
                  </p>
                )}

                {/* Rejection reason */}
                {m.estado === 'RECHAZADA' && m.rechazadoReason && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">
                      <strong>Rechazo:</strong> {m.rechazadoReason}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action for pending/rejected */}
                {(m.estado === 'PENDIENTE' || m.estado === 'RECHAZADA') && i === 0 && (
                  <Link href="/cliente/membresia">
                    <Button size="sm" className="bg-sky-500 hover:bg-sky-400">
                      {m.estado === 'RECHAZADA' ? 'Reenviar comprobante' : 'Enviar comprobante'}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
