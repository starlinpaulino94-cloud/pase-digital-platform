import Link from 'next/link'
import { Car, Calendar, Droplets, Infinity as InfinityIcon, QrCode, Sparkles } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getClienteFull, activeMembership } from '@/modules/cliente/queries'
import { QRDisplay } from '@/components/qr/QRDisplay'
import { EstadoBadge } from '@/components/EstadoBadge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
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

  const membership = cliente.memberships[0]
  const active = activeMembership(cliente.memberships)
  // El QR solo se muestra si hay membresía ACTIVA
  const token = active ? cliente.qrTokens[0]?.token : undefined
  const isCarwash = cliente.company.type === 'carwash'
  const unidad = isCarwash ? 'lavados' : 'consumos'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {cliente.nombre.split(' ')[0]}
        </h1>
        <p className="text-slate-500">{cliente.company.name}</p>
      </div>

      {!active && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Activa tu Pase Digital</AlertTitle>
          <AlertDescription>
            {!membership
              ? 'Aún no tienes una membresía. '
              : 'Tu membresía está pendiente de pago. '}
            <Link href="/cliente/planes" className="font-medium text-sky-600">
              Ver oportunidades disponibles
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR — solo se muestra si hay membresía activa */}
        {active && token ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-sky-500" />
                Tu Pase Digital
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <QRDisplay token={token} />
              <p className="text-center text-sm text-slate-500">
                Muéstralo en {cliente.company.name} para registrar tu visita.
              </p>
              <p className="text-center text-xs text-slate-400">
                Tu QR se renueva automáticamente después de cada uso.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <QrCode className="mb-3 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-600">Sin Pase Digital activo</p>
            <p className="mt-1 text-sm text-slate-400">
              Activa una membresía para obtener tu QR
            </p>
            <Link href="/cliente/planes" className="mt-4">
              <Button className="bg-sky-500 hover:bg-sky-400">
                Ver oportunidades
              </Button>
            </Link>
          </Card>
        )}

        {/* Membership status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mi membresía</CardTitle>
            {membership && (
              <EstadoBadge estado={membership.estado as MembershipEstado} />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {membership ? (
              <>
                <div>
                  <p className="text-sm text-slate-500">Plan</p>
                  <p className="text-lg font-semibold">
                    {membership.plan.nombre}
                  </p>
                </div>
                <div className="rounded-lg bg-sky-50 p-4">
                  <div className="flex items-center gap-2 text-sky-700">
                    {membership.plan.esIlimitado ? (
                      <>
                        <InfinityIcon className="h-5 w-5" />
                        <span className="text-lg font-bold">
                          {unidad} ilimitados
                        </span>
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
                  <Calendar className="h-4 w-4" />
                  Vence: {fmtDate(membership.fechaVencimiento)}
                </div>
                {membership.estado === 'PENDIENTE' && (
                  <Alert>
                    <AlertDescription>
                      Tu pago está pendiente de confirmación por la empresa.
                    </AlertDescription>
                  </Alert>
                )}
                <Link href="/cliente/membresia">
                  <Button variant="outline" className="w-full">
                    Ver detalles del plan
                  </Button>
                </Link>
              </>
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

      {/* Vehicles (carwash) */}
      {isCarwash && cliente.vehiculos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mis vehículos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {cliente.vehiculos.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-lg border p-3"
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
        <CardHeader>
          <CardTitle>Visitas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {cliente.visits.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no tienes visitas.</p>
          ) : (
            <ul className="divide-y">
              {cliente.visits.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium">{v.servicio}</p>
                    <p className="text-sm text-slate-500">
                      {fmtDate(v.fechaVisita)}
                    </p>
                  </div>
                  {v.descontado && (
                    <span className="text-xs text-slate-400">
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
