import Link from 'next/link'
import {
  CreditCard,
  ExternalLink,
  FileText,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getClientePagos } from '@/modules/cliente/queries'
import { EstadoBadge } from '@/components/EstadoBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

function fmtMonto(n: number | null) {
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

const NECESITA_PAGO = ['PENDIENTE', 'RECHAZADA']

export default async function PagosPage() {
  const user = await requireRole('CLIENTE')
  const clienteId = user.metadata.clienteId
  if (!clienteId) return <p className="text-slate-600">No autorizado.</p>

  let data: Awaited<ReturnType<typeof getClientePagos>> = { membership: null, historial: [] }
  let loadError = false
  try {
    data = await getClientePagos(clienteId)
  } catch (e) {
    loadError = true
    console.error('[cliente-pagos]', e)
  }

  const { membership: m, historial } = data
  const necesitaPago = m ? NECESITA_PAGO.includes(m.estado) : false
  const cambioPendiente = !!m?.planSolicitadoNombre

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mis pagos</h1>
        <p className="text-slate-500">Estado de tu membresía e historial de pagos</p>
      </div>

      {loadError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center">
            <p className="font-medium text-foreground">No pudimos cargar tus pagos.</p>
            <p className="mt-1 text-sm text-muted-foreground">Intenta de nuevo en unos momentos.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/cliente/pagos">Reintentar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : !m ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Sin pagos todavía</p>
            <p className="text-sm">Selecciona un plan para comenzar tu membresía.</p>
            <Button asChild className="mt-4 bg-sky-500 hover:bg-sky-400">
              <Link href="/cliente/planes">Ver planes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Estado actual */}
          <Card className="ring-1 ring-sky-200">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{m.planNombre}</CardTitle>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Solicitado: {fmtDate(m.createdAt)}
                  </p>
                </div>
                <EstadoBadge estado={m.estado as MembershipEstado} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div>
                  <p className="text-slate-500">Estado</p>
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

              {m.metodoPagoNombre && (
                <p className="text-xs text-slate-500">
                  Método de pago: <strong>{m.metodoPagoNombre}</strong>
                </p>
              )}

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

              {m.estado === 'RECHAZADA' && m.rechazadoReason && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  <strong>Motivo del rechazo:</strong> {m.rechazadoReason}
                </div>
              )}

              {/* Cambio de plan pendiente */}
              {cambioPendiente && (
                <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                  <ArrowRightLeft className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Cambio a <strong>{m.planSolicitadoNombre}</strong> solicitado. Sube el
                    comprobante del nuevo plan para que el equipo lo apruebe.
                  </span>
                </div>
              )}

              {/* CTA de pago */}
              {(necesitaPago || cambioPendiente) && (
                <Button asChild className="bg-sky-500 hover:bg-sky-400">
                  <Link href={`/membresia/${m.id}`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {m.estado === 'RECHAZADA'
                      ? 'Reenviar comprobante'
                      : cambioPendiente
                        ? 'Subir comprobante del cambio'
                        : 'Completar pago'}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Historial de pagos */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Historial de pagos</h2>
            {historial.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-slate-500">
                  Aún no hay pagos aprobados o rechazados registrados.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="divide-y p-0">
                  {historial.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-4">
                      {h.tipo === 'APROBADO' ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                      ) : (
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                      )}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            {h.tipo === 'APROBADO' ? 'Pago aprobado' : 'Pago rechazado'}
                            {h.planNombre && (
                              <span className="font-normal text-slate-500"> · {h.planNombre}</span>
                            )}
                          </p>
                          {h.tipo === 'APROBADO' && h.monto != null && (
                            <span className="text-sm font-semibold text-slate-900">
                              {fmtMonto(h.monto)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{fmtDateTime(h.fecha)}</p>
                        {h.motivo && (
                          <p className="mt-1 text-xs text-slate-500 italic">Motivo: {h.motivo}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
