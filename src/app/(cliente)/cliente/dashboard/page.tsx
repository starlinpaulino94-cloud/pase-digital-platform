import Link from 'next/link'
import {
  Car,
  Calendar,
  Droplets,
  Infinity as InfinityIcon,
  AlertTriangle,
  AlertCircle,
  Clock,
  ChevronRight,
  History,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getClienteFull, activeMembership } from '@/modules/cliente/queries'
import { QRDisplay } from '@/components/qr/QRDisplay'
import { EstadoBadge } from '@/components/EstadoBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

export default async function ClienteDashboard() {
  const user = await requireRole('CLIENTE')
  let cliente = null
  try {
    cliente = user.metadata.clienteId
      ? await getClienteFull(user.metadata.clienteId)
      : null
  } catch (e) {
    console.error('[cliente-dashboard]', e)
    return (
      <p className="text-slate-600">
        No pudimos cargar tu información en este momento. Intenta de nuevo más tarde.
      </p>
    )
  }

  if (!cliente) {
    return <p className="text-slate-600">No se encontró tu información.</p>
  }

  const membership = activeMembership(cliente.memberships)
  const latest = cliente.memberships[0]
  const token = cliente.qrTokens[0]?.token
  const isCarwash = cliente.company.type === 'carwash'
  const unidad = isCarwash ? 'lavados' : 'consumos'

  const daysLeft = membership?.fechaVencimiento
    ? Math.max(0, Math.ceil((membership.fechaVencimiento.getTime() - Date.now()) / 86400000))
    : null

  // Alerts
  const alertas: {
    type: 'warn' | 'error' | 'info'
    title: string
    body: string
    href?: string
  }[] = []

  if (!membership && !latest) {
    alertas.push({ type: 'info', title: 'Sin membresía', body: 'Elige un plan para empezar.', href: '/cliente/membresia' })
  }
  if (latest?.estado === 'RECHAZADA') {
    alertas.push({
      type: 'error',
      title: 'Pago rechazado',
      body: latest.rechazadoReason ? `Motivo: ${latest.rechazadoReason}` : 'Tu comprobante fue rechazado.',
      href: '/cliente/membresia',
    })
  }
  if (latest?.estado === 'PENDIENTE_PAGO') {
    alertas.push({ type: 'info', title: 'Comprobante en revisión', body: 'El equipo lo revisará pronto.' })
  }
  if (latest?.estado === 'PENDIENTE') {
    alertas.push({ type: 'warn', title: 'Pago pendiente', body: 'Sube tu comprobante para activar tu membresía.', href: '/cliente/membresia' })
  }
  if (daysLeft !== null && daysLeft <= 7) {
    alertas.push({ type: 'warn', title: `Membresía vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`, body: 'Contacta a la empresa para renovar.' })
  }
  if (membership && !membership.plan.esIlimitado && membership.lavadosRestantes === 0) {
    alertas.push({ type: 'error', title: 'Sin usos disponibles', body: 'Agotaste los usos de este período.' })
  } else if (membership && !membership.plan.esIlimitado && membership.lavadosRestantes === 1) {
    alertas.push({ type: 'warn', title: 'Último uso disponible', body: 'Solo te queda 1 uso en este período.' })
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Greeting */}
      <div>
        <p className="text-sm font-medium text-muted-foreground">{cliente.company.name}</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Hola, {cliente.nombre.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Alerts */}
      {alertas.map((a) => (
        <Alert
          key={a.title}
          variant={a.type === 'error' ? 'destructive' : 'default'}
          className={
            a.type === 'warn'
              ? 'border-amber-300 bg-amber-50 text-amber-800 [&>svg]:text-amber-600'
              : a.type === 'info'
              ? 'border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-500'
              : undefined
          }
        >
          {a.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertTitle className="font-semibold">{a.title}</AlertTitle>
          <AlertDescription>
            {a.body}
            {a.href && (
              <Link href={a.href} className="ml-2 font-semibold underline underline-offset-2">
                Ver →
              </Link>
            )}
          </AlertDescription>
        </Alert>
      ))}

      {/* QR + Membership */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* QR Card */}
        <Card className="overflow-hidden border-0 shadow-card-hover">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  MembreGo
                </p>
                <p className="font-bold text-white">{cliente.nombre}</p>
              </div>
              {membership && (
                <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs font-medium text-green-300">Activo</span>
                </div>
              )}
            </div>

            <div className="flex justify-center py-3">
              {token ? (
                <div className="rounded-2xl bg-white p-3">
                  <QRDisplay token={token} size={160} />
                </div>
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-white/20">
                  <p className="text-center text-xs text-white/40 px-4">
                    QR se activa al confirmar tu pago
                  </p>
                </div>
              )}
            </div>

            {membership && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5">
                <div>
                  <p className="text-xs text-white/60">Plan</p>
                  <p className="text-sm font-semibold text-white">{membership.plan.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60">Vence</p>
                  <p className="text-sm font-semibold text-white">{fmtDate(membership.fechaVencimiento)}</p>
                </div>
              </div>
            )}
          </div>

          {!token && (
            <CardContent className="pt-4">
              <Link href="/cliente/membresia">
                <Button className="w-full bg-sky-500 hover:bg-sky-400">
                  Activar membresía
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>

        {/* Stats */}
        <div className="flex flex-col gap-4">
          {membership ? (
            <>
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {unidad.charAt(0).toUpperCase() + unidad.slice(1)} restantes
                    </p>
                    <div className="rounded-lg bg-sky-50 p-1.5 ring-1 ring-sky-100">
                      {membership.plan.esIlimitado
                        ? <InfinityIcon className="h-4 w-4 text-sky-600" />
                        : <Droplets className="h-4 w-4 text-sky-600" />
                      }
                    </div>
                  </div>
                  <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
                    {membership.plan.esIlimitado ? '∞' : membership.lavadosRestantes}
                  </p>
                  {!membership.plan.esIlimitado && (
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{
                          width: `${Math.min(100, (membership.lavadosRestantes / (membership.plan.lavadosIncluidos || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/60">
                  <CardContent className="p-4 text-center">
                    <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                      <Zap className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{cliente.visits.length}</p>
                    <p className="text-xs text-muted-foreground">visitas totales</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-4 text-center">
                    <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{daysLeft ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">días restantes</p>
                  </CardContent>
                </Card>
              </div>

              <Link href="/cliente/membresia">
                <Button variant="outline" className="w-full gap-1.5 text-slate-600">
                  Ver detalles del plan
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <Card className="flex flex-1 flex-col items-center justify-center border-dashed py-10 text-center">
              <CardContent className="space-y-3">
                <p className="text-slate-500">
                  {latest ? `Estado: ${latest.estado}` : 'Sin plan activo'}
                </p>
                <Link href="/cliente/membresia">
                  <Button className="bg-sky-500 hover:bg-sky-400">
                    {latest ? 'Ver estado' : 'Elegir plan'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Membership badge */}
      {latest && (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <EstadoBadge estado={latest.estado as MembershipEstado} />
            <p className="text-sm text-muted-foreground">
              {latest.plan.nombre}
            </p>
          </div>
          <Link href="/cliente/pagos" className="text-xs text-sky-600 hover:underline">
            Ver historial de pagos →
          </Link>
        </div>
      )}

      {/* Vehicles */}
      {isCarwash && cliente.vehiculos.length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              Mis vehículos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {cliente.vehiculos.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Car className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">{v.marca} {v.modelo} ({v.anio})</p>
                  <p className="text-xs text-muted-foreground">
                    {v.color}{v.placa ? ` · ${v.placa}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent visits */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Visitas recientes
          </CardTitle>
          {cliente.visits.length >= 10 && (
            <Link href="/cliente/historial">
              <Button variant="ghost" size="sm" className="gap-1 text-sky-600 text-xs h-7 px-2">
                Ver todo <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {cliente.visits.length === 0 ? (
            <div className="py-8 text-center">
              <History className="mx-auto h-8 w-8 text-slate-200" />
              <p className="mt-2 text-sm text-muted-foreground">Aún no tienes visitas registradas.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {cliente.visits.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{v.servicio}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDateTime(v.fechaVisita)}
                      {v.sucursal ? ` · ${v.sucursal.nombre}` : ''}
                    </p>
                  </div>
                  {v.descontado && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-500">
                      −1 {unidad.slice(0, -1)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
