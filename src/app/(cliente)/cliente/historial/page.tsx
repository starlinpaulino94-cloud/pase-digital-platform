import Link from 'next/link'
import { ChevronLeft, ChevronRight, History } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getClienteVisitas } from '@/modules/cliente/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat('es-DO', {
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
  if (!clienteId) return <p>No autorizado.</p>

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1))

  const { total, visitas, pages } = await getClienteVisitas(clienteId, page, PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cliente/dashboard">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de visitas</h1>
          <p className="text-slate-500">{total} visita{total !== 1 ? 's' : ''} registradas</p>
        </div>
      </div>

      {visitas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <History className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Sin visitas registradas</p>
            <p className="text-sm">Tus visitas aparecerán aquí cuando el empleado las confirme.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {visitas.map((v) => (
                <li key={v.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{v.servicio}</p>
                      <p className="text-sm text-slate-500">
                        {fmtDateTime(v.fechaVisita)}
                        {v.sucursal ? (
                          <span className="ml-2 text-slate-400">· {v.sucursal.nombre}</span>
                        ) : null}
                      </p>
                      {v.vehiculo && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {v.vehiculo.marca} {v.vehiculo.modelo}
                          {v.vehiculo.placa ? ` · ${v.vehiculo.placa}` : ''}
                        </p>
                      )}
                      {v.membership && (
                        <p className="text-xs text-slate-400">
                          Plan: {v.membership.plan.nombre}
                        </p>
                      )}
                      {v.notas && (
                        <p className="mt-1 text-xs italic text-slate-400">{v.notas}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {v.descontado ? (
                        <Badge variant="secondary" className="bg-red-50 text-red-600 text-xs">
                          −1 uso
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-50 text-green-600 text-xs">
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

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Link href={`?page=${page - 1}`}>
            <Button variant="outline" size="sm" disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          </Link>
          <span className="text-sm text-slate-600">
            Página {page} de {pages}
          </span>
          <Link href={`?page=${page + 1}`}>
            <Button variant="outline" size="sm" disabled={page >= pages}>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
