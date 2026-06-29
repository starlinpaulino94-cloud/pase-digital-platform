import { requireRole } from '@/lib/auth/guards'
import { companyFilter, getReportesAdmin } from '@/modules/admin/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function fmtMoney(n: number) {
  return `RD$${new Intl.NumberFormat('es-DO').format(n)}`
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

export default async function ReportesPage() {
  const user = await requireRole(['ADMIN_EMPRESA', 'SUPERADMIN'])
  const companyId = companyFilter(user)

  let data = {
    ingresosMes: 0,
    activasPorPlan: [] as { plan: string; count: number }[],
    lavadosMes: 0,
    clientesFrecuentes: [] as { clienteId: string; nombre: string; visitas: number }[],
    membresiasPorVencer: [] as {
      id: string
      cliente: string
      plan: string
      fechaVencimiento: Date | null
    }[],
  }
  try {
    data = await getReportesAdmin(companyId === '__none__' ? undefined : companyId)
  } catch (e) {
    console.error('[admin-reportes]', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-slate-500">Resumen del mes en curso</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Ingresos del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {fmtMoney(data.ingresosMes)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Lavados realizados este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {data.lavadosMes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Membresías activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {data.activasPorPlan.reduce((s, p) => s + p.count, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membresías activas por plan</CardTitle>
          </CardHeader>
          <CardContent>
            {data.activasPorPlan.length === 0 ? (
              <p className="text-sm text-slate-500">Sin membresías activas.</p>
            ) : (
              <ul className="divide-y">
                {data.activasPorPlan.map((p) => (
                  <li
                    key={p.plan}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span className="text-slate-700">{p.plan}</span>
                    <span className="font-semibold text-slate-900">
                      {p.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes más frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.clientesFrecuentes.length === 0 ? (
              <p className="text-sm text-slate-500">Sin visitas registradas.</p>
            ) : (
              <ul className="divide-y">
                {data.clientesFrecuentes.map((c) => (
                  <li
                    key={c.clienteId}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span className="text-slate-700">{c.nombre}</span>
                    <span className="font-semibold text-slate-900">
                      {c.visitas} visitas
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membresías por vencer (próximos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.membresiasPorVencer.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay membresías por vencer.
            </p>
          ) : (
            <ul className="divide-y">
              {data.membresiasPorVencer.map((m) => (
                <li key={m.id} className="flex justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{m.cliente}</p>
                    <p className="text-slate-500">{m.plan}</p>
                  </div>
                  <span className="text-slate-600">
                    {fmtDate(m.fechaVencimiento)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
