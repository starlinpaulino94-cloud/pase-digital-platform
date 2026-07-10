import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  History,
  CalendarDays,
  MapPin,
  User,
  Car,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getClienteVisitas, type HistorialVisitas } from '@/modules/cliente/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await requireRole('CLIENTE')
  const clienteId = user.metadata.clienteId
  if (!clienteId) return <p className="text-slate-600">No autorizado.</p>

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1) || 1)

  let result: HistorialVisitas = { total: 0, esteMes: 0, visitas: [], pages: 0 }
  let loadError = false
  try {
    result = await getClienteVisitas(clienteId, page, PAGE_SIZE)
  } catch (e) {
    loadError = true
    console.error('[cliente-historial]', e)
  }
  const { total, esteMes, visitas, pages } = result

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial de visitas</h1>
        <p className="text-slate-500">Cada uso registrado de tu membresía.</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <div className="rounded-lg bg-sky-100 p-2">
              <History className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{total}</p>
              <p className="text-sm text-slate-500">Visitas totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <div className="rounded-lg bg-violet-100 p-2">
              <CalendarDays className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{esteMes}</p>
              <p className="text-sm text-slate-500">Este mes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loadError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center">
            <p className="font-medium text-foreground">No pudimos cargar tu historial.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/cliente/historial">Reintentar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : visitas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <History className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Sin visitas registradas</p>
            <p className="text-sm">
              Tus visitas aparecerán aquí cuando el empleado las confirme.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {visitas.map((v) => (
                <li key={v.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-slate-800">{v.servicio}</p>
                      <p className="text-sm text-slate-500">{fmtDateTime(v.fechaVisita)}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        {v.sucursal && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {v.sucursal}
                          </span>
                        )}
                        {v.empleado && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" /> {v.empleado}
                          </span>
                        )}
                        {v.vehiculo && (
                          <span className="inline-flex items-center gap-1">
                            <Car className="h-3 w-3" /> {v.vehiculo.marca} {v.vehiculo.modelo}
                            {v.vehiculo.placa ? ` · ${v.vehiculo.placa}` : ''}
                          </span>
                        )}
                        {v.planNombre && <span>Plan: {v.planNombre}</span>}
                      </div>

                      {v.notas && (
                        <p className="mt-1 text-xs italic text-slate-400">“{v.notas}”</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {v.descontado ? (
                        <Badge variant="secondary" className="bg-red-50 text-xs text-red-600">
                          −1 uso
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-50 text-xs text-green-600">
                          Sin descuento
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`?page=${page - 1}`}>
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          )}
          <span className="text-sm text-slate-600">
            Página {page} de {pages}
          </span>
          {page < pages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`?page=${page + 1}`}>
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
