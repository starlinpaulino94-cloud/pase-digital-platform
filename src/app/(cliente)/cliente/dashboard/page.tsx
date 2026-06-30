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

  // Compute alerts
  const alertas: { type: 'warn' | 'error' | 'info'; title: string; body: string; href?: string }[] = []

  if (!membership && !latest) {
    alertas.push({
      type: 'info',
      title: 'Sin membresía',
      body: 'Elige un plan para empezar a disfrutar tus beneficios.',
      href: '/cliente/membresia',
    })
  }

  if (latest?.estado === 'RECHAZADA') {
    alertas.push({
      type: 'error',
      title: 'Pago rechazado',
      body: latest.rechazadoReason
        ? `Motivo: ${latest.rechazadoReason}`
        : 'Tu comprobante de pago fue rechazado.',
      href: '/cliente/membresia',
    })
  }

  if (latest?.estado === 'PENDIENTE_PAGO') {
    alertas.push({
      type: 'info',
      title: 'Comprobante en revisión',
      body: 'Tu comprobante fue enviado y está siendo revisado por el equipo.',
    })
  }

  if (latest?.estado === 'PENDIENTE') {
    alertas.push({
      type: 'warn',
      title: 'Pago pendiente',
      body: 'Realiza tu pago y sube el comprobante para activar tu membresía.',
      href: '/cliente/membresia',
    })
  }

  if (membership?.fechaVencimiento) {
    const daysLeft = Math.ceil(
      (membership.fechaVencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft <= 7) {
      alertas.push({
        type: 'warn',
        title: `Membresía vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
        body: 'Contacta a la empresa o renueva tu plan para no perder acceso.',
      })
    }
  }

  if (membership && !membership.plan.esIlimitado && membership.lavadosRestantes === 0) {
    alertas.push({
      type: 'error',
      title: 'Sin usos disponibles',
      body: 'Agotaste los usos de este período. Contacta a la empresa para renovar.',
    })
  } else if (membership && !membership.plan.esIlimitado && membership.lavadosRestantes === 1) {
    alertas.push({
      type: 'warn',
      title: 'Último uso disponible',
      body: 'Solo te queda 1 uso en este período.',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {cliente.nombre.split(' ')[0]}
        </h1>
        <p className="text-slate-500">{cliente.company.name}</p>
      </div>

      {/* Alerts */}
      {alertas.map((a) => (
        <Alert
          key={a.title}
          variant={a.type === 'error' ? 'destructive' : 'default'}
          className={
            a.type === 'warn'
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : a.type === 'info'
              ? 'border-blue-200 bg-blue-50 text-blue-800'
              : undefined
          }
        >
          {a.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>{a.title}</AlertTitle>
          <AlertDescription>
            {a.body}
            {a.href && (
              <Link href={a.href} className="ml-2 font-semibold underline">
                Ver →
              </Link>
            )}
          </AlertDescription>
        </Alert>
      ))}

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>Tu código QR</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {token ? (
              <>
                <QRDisplay token={token} />
                <p className="text-center text-sm text-slate-500">
                  Muéstralo en {cliente.company.name} para registrar tu visita.
                </p>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-slate-400 text-sm">
                  Tu QR se generará cuando tu membresía sea activada.
                </p>
                <Link href="/cliente/membresia" className="mt-3 block">
                  <Button variant="outline" size="sm">
                    Ver planes
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membership status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mi membresía</CardTitle>
            {latest && (
              <EstadoBadge estado={latest.estado as MembershipEstado} />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {membership ? (
              <>
                <div>
                  <p className="text-sm text-slate-500">Plan</p>
                  <p className="text-lg font-semibold">{membership.plan.nombre}</p>
                </div>
                <div className="rounded-xl bg-sky-50 p-4">
                  <div className="flex items-center gap-2 text-sky-700">
                    {membership.plan.esIlimitado ? (
                      <>
                        <InfinityIcon className="h-5 w-5" />
                        <span className="text-lg font-bold">{unidad} ilimitados</span>
                      </>
                    ) : (
                      <>
                        <Droplets className="h-5 w-5" />
                        <span className="text-lg font-bold">
                          {membership.lavadosRestantes} {unidad} restantes
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Vence: {fmtDate(membership.fechaVencimiento)}
                </div>
              </>
            ) : latest ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Plan: <strong>{latest.plan.nombre}</strong>
                </p>
                <p className="text-xs text-slate-400">
                  Solicitado: {fmtDate(latest.createdAt)}
                </p>
                <Link href="/cliente/membresia">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver detalles
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/cliente/membresia">
                <Button className="w-full bg-sky-500 hover:bg-sky-400">
                  Elegir un plan
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats row */}
      {membership && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {cliente.visits.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Visitas totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {membership.plan.esIlimitado ? '∞' : membership.lavadosRestantes}
              </p>
              <p className="text-xs text-slate-500 mt-1">{unidad} restantes</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {membership.fechaVencimiento
                  ? Math.max(
                      0,
                      Math.ceil(
                        (membership.fechaVencimiento.getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">días restantes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vehicles */}
      {isCarwash && cliente.vehiculos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mis vehículos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {cliente.vehiculos.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
              >
                <Car className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-medium">
                    {v.marca} {v.modelo} ({v.anio})
                  </p>
                  <p className="text-sm text-slate-500">
                    {v.color}
                    {v.placa ? ` · ${v.placa}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent visits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" />
            Visitas recientes
          </CardTitle>
          {cliente.visits.length >= 10 && (
            <Link href="/cliente/historial">
              <Button variant="ghost" size="sm" className="gap-1 text-sky-600">
                Ver todo <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {cliente.visits.length === 0 ? (
            <div className="py-8 text-center">
              <History className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">Aún no tienes visitas registradas.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cliente.visits.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800">{v.servicio}</p>
                    <p className="text-sm text-slate-500">
                      {fmtDateTime(v.fechaVisita)}
                      {v.sucursal ? ` · ${v.sucursal.nombre}` : ''}
                    </p>
                  </div>
                  {v.descontado && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
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
