import { Droplets } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getVisitHistory, getClienteBasic } from '@/modules/cliente/queries'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export default async function HistorialPage() {
  const user = await requireRole('CLIENTE')

  if (!user.metadata.clienteId) {
    return <p className="text-slate-600">No se encontró tu información.</p>
  }

  let visits: Awaited<ReturnType<typeof getVisitHistory>> = []
  let cliente: Awaited<ReturnType<typeof getClienteBasic>> = null
  try {
    ;[visits, cliente] = await Promise.all([
      getVisitHistory(user.metadata.clienteId),
      getClienteBasic(user.metadata.clienteId),
    ])
  } catch (e) {
    console.error('[cliente-historial]', e)
    return (
      <p className="text-slate-600">
        No pudimos cargar tu historial en este momento. Intenta de nuevo más
        tarde.
      </p>
    )
  }

  const isCarwash = cliente?.company.type === 'carwash'
  const unidad = isCarwash ? 'lavado' : 'consumo'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial de visitas</h1>
        <p className="text-slate-500">{visits.length} visitas registradas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tus visitas</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no tienes visitas registradas.
            </p>
          ) : (
            <ul className="divide-y">
              {visits.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{v.servicio}</p>
                    <p className="text-sm text-slate-500">
                      {fmtDate(v.fechaVisita)}
                      {v.vehiculo
                        ? ` · ${v.vehiculo.marca} ${v.vehiculo.modelo}`
                        : ''}
                    </p>
                  </div>
                  {v.descontado ? (
                    <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                      <Droplets className="h-3.5 w-3.5" />
                      −1 {unidad}
                    </span>
                  ) : (
                    <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                      Sin descuento
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
