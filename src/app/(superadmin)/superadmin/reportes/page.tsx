import { requireRole } from '@/lib/auth/guards'
import { getReportesGlobales, type ReportesData } from '@/modules/admin/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function fmtMoney(n: number) {
  return `RD$${new Intl.NumberFormat('es-DO').format(n)}`
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

function activasTotal(data: ReportesData) {
  return data.activasPorPlan.reduce((s, p) => s + p.count, 0)
}

export default async function SuperadminReportesPage() {
  await requireRole('SUPERADMIN')

  let total: ReportesData = {
    ingresosMes: 0,
    activasPorPlan: [],
    lavadosMes: 0,
    clientesFrecuentes: [],
    membresiasPorVencer: [],
  }
  let empresas: { companyId: string; nombre: string; data: ReportesData }[] = []

  try {
    const reportes = await getReportesGlobales()
    total = reportes.total
    empresas = reportes.empresas
  } catch (e) {
    console.error('[superadmin-reportes]', e)
  }

  const cards = [
    { label: 'Ingresos del mes', value: fmtMoney(total.ingresosMes) },
    { label: 'Lavados este mes', value: String(total.lavadosMes) },
    { label: 'Membresías activas', value: String(activasTotal(total)) },
    {
      label: 'Por vencer (7 días)',
      value: String(total.membresiasPorVencer.length),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes globales</h1>
        <p className="text-slate-500">Todas las empresas · mes en curso</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Por empresa
        </h2>
        <div className="space-y-4">
          {empresas.length === 0 && (
            <p className="text-sm text-slate-500">No hay empresas.</p>
          )}
          {empresas.map((emp) => (
            <Card key={emp.companyId}>
              <CardHeader>
                <CardTitle>{emp.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric
                    label="Ingresos del mes"
                    value={fmtMoney(emp.data.ingresosMes)}
                  />
                  <Metric
                    label="Lavados este mes"
                    value={String(emp.data.lavadosMes)}
                  />
                  <Metric
                    label="Membresías activas"
                    value={String(activasTotal(emp.data))}
                  />
                </div>

                {emp.data.activasPorPlan.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-500">
                      Activas por plan
                    </p>
                    <ul className="divide-y">
                      {emp.data.activasPorPlan.map((p) => (
                        <li
                          key={p.plan}
                          className="flex justify-between py-1 text-sm"
                        >
                          <span className="text-slate-700">{p.plan}</span>
                          <span className="font-semibold text-slate-900">
                            {p.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {emp.data.membresiasPorVencer.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-500">
                      Por vencer (próximos 7 días)
                    </p>
                    <ul className="divide-y">
                      {emp.data.membresiasPorVencer.map((m) => (
                        <li
                          key={m.id}
                          className="flex justify-between py-1 text-sm"
                        >
                          <span className="text-slate-700">
                            {m.cliente} · {m.plan}
                          </span>
                          <span className="text-slate-600">
                            {fmtDate(m.fechaVencimiento)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
