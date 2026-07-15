import Link from 'next/link'
import {
  CreditCard,
  ExternalLink,
  FileText,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Receipt,
  Wallet,
  CalendarClock,
  Sparkles,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getClientePagos } from '@/modules/cliente/queries'
import { getRegionalPrefs } from '@/modules/empresas/regional'
import { formatMoney } from '@/lib/format'
import { EstadoBadge } from '@/components/EstadoBadge'
import { membresiaEstadoUi } from '@/lib/estados'
import { Button } from '@/components/ui/button'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Mis pagos',
  description: 'Estado de tu membresía e historial de pagos',
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', {
    timeZone: 'America/Santo_Domingo',
    dateStyle: 'medium',
  }).format(d)
}

function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat('es-DO', {
    timeZone: 'America/Santo_Domingo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

const NECESITA_PAGO = ['PENDIENTE', 'RECHAZADA']

export default async function PagosPage() {
  const user = await requireRole('CLIENTE')
  const clienteId = user.metadata.clienteId
  if (!clienteId) {
    return (
      <main className="container max-w-5xl py-8">
        <p className="text-muted-foreground">No autorizado.</p>
      </main>
    )
  }

  const prefs = await getRegionalPrefs(user.metadata.companyId)
  const fmtMonto = (n: number | null) => (n ? formatMoney(n, prefs) : '—')

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
    <main className="container max-w-5xl py-8">
      {/* ── Cabecera ──────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Finanzas
            </p>
            <h1 className="mt-1.5 text-h1 tracking-tight text-foreground">
              Mis pagos
            </h1>
            <p className="mt-1 text-small text-muted-foreground">
              Estado de tu membresía e historial de pagos.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/mis-membresias">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mis membresías
            </Link>
          </Button>
        </div>
      </header>

      {loadError ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <XCircle className="h-7 w-7 text-destructive" />
          </span>
          <div>
            <p className="font-semibold text-foreground">No pudimos cargar tus pagos.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Intenta de nuevo en unos momentos.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/cliente/pagos">Reintentar</Link>
          </Button>
        </div>
      ) : !m ? (
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-10 text-center shadow-card">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-info/10 blur-3xl" />
          <div className="relative mx-auto flex max-w-md flex-col items-center gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Sin pagos todavía
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Selecciona un plan para comenzar tu membresía y aquí verás todos tus pagos.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/cliente/planes">
                <Sparkles className="mr-2 h-4 w-4" />
                Ver planes
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Estado actual de membresía ─────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Membresía actual</h2>
              <EstadoBadge estado={m.estado as MembershipEstado} />
            </div>

            <div className="p-5">
              {/* Plan name + amount hero */}
              <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-xl font-bold text-foreground">{m.planNombre}</h3>
                {m.montoPagado != null && (
                  <span className="text-2xl font-extrabold tracking-tight text-foreground">
                    {fmtMonto(m.montoPagado)}
                  </span>
                )}
              </div>

              {/* Key data grid */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {membresiaEstadoUi(m.estado).label}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Monto</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {fmtMonto(m.montoPagado)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Inicio</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {fmtDate(m.fechaInicio)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {fmtDate(m.fechaVencimiento)}
                  </p>
                </div>
              </div>

              {m.metodoPagoNombre && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Método: <span className="font-medium text-foreground">{m.metodoPagoNombre}</span>
                </div>
              )}

              {m.comprobanteUrl && (
                <a
                  href={m.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border/70 px-3.5 py-2 text-sm text-primary transition hover:bg-muted"
                >
                  <FileText className="h-4 w-4" />
                  Ver comprobante
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {m.estado === 'RECHAZADA' && m.rechazadoReason && (
                <div className="mb-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3.5 text-sm text-destructive">
                  <strong>Motivo del rechazo:</strong> {m.rechazadoReason}
                </div>
              )}

              {cambioPendiente && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">
                      Cambio a {m.planSolicitadoNombre} solicitado
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      Sube el comprobante del nuevo plan para que el equipo lo apruebe.
                    </p>
                  </div>
                </div>
              )}

              {(necesitaPago || cambioPendiente) && (
                <Button asChild className="shadow-glow">
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
            </div>
          </section>

          {/* ── Historial ─────────────────────────────────────────────────── */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Historial de pagos
              </h2>
              {historial.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {historial.length}
                </span>
              )}
            </div>

            {historial.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-card px-5 py-10 text-center shadow-card">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <CalendarClock className="h-6 w-6 text-muted-foreground" />
                </span>
                <p className="text-sm font-medium text-foreground">Sin historial</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Aquí aparecerán tus pagos aprobados y rechazados.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
                <div className="divide-y divide-border/50">
                  {historial.map((h) => (
                    <div key={h.id} className="flex items-start gap-3.5 px-5 py-4">
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          h.tipo === 'APROBADO'
                            ? 'bg-success/12 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {h.tipo === 'APROBADO' ? (
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        ) : (
                          <XCircle className="h-4.5 w-4.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {h.tipo === 'APROBADO' ? 'Pago aprobado' : 'Pago rechazado'}
                            {h.planNombre && (
                              <span className="ml-1 font-normal text-muted-foreground">
                                · {h.planNombre}
                              </span>
                            )}
                          </p>
                          {h.tipo === 'APROBADO' && h.monto != null && (
                            <span className="text-sm font-bold text-foreground">
                              {fmtMonto(h.monto)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {fmtDateTime(h.fecha)}
                        </p>
                        {h.motivo && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            Motivo: {h.motivo}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
