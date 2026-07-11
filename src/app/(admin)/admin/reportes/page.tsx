import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { companyFilter, getReportesAdmin } from '@/modules/admin/queries'
import { getRegionalPrefs } from '@/modules/empresas/regional'
import { getTransactionAnalytics, type TransactionAnalytics } from '@/lib/transactions'
import { formatMoney, formatDate } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBanner } from '@/components/ui/status-banner'

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)
  const prefs = await getRegionalPrefs(companyId)
  const fmtMoney = (n: number) => formatMoney(n, prefs)
  const fmtDate = (d: Date | null) => (d ? formatDate(d, prefs) : '—')

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
  let loadError = false
  try {
    data = await getReportesAdmin(companyId === '__none__' ? undefined : companyId)
  } catch (e) {
    console.error('[admin-reportes]', e)
    loadError = true
  }

  // Fase E4: métricas del Transaction Engine (últimos 30 días).
  let tx: TransactionAnalytics | null = null
  if (companyId && companyId !== '__none__') {
    try {
      tx = await getTransactionAnalytics(companyId)
    } catch (e) {
      console.error('[admin-reportes] analytics tx:', e)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Resumen del mes en curso" />

      {loadError && (
        <StatusBanner variant="destructive" title="No pudimos cargar los reportes">
          Las cifras pueden mostrarse en cero. Recarga la página para intentarlo de nuevo.
        </StatusBanner>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {fmtMoney(data.ingresosMes)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usos registrados este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {data.lavadosMes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membresías activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
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
              <p className="text-sm text-muted-foreground">Sin membresías activas.</p>
            ) : (
              <ul className="divide-y">
                {data.activasPorPlan.map((p) => (
                  <li
                    key={p.plan}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span className="text-foreground">{p.plan}</span>
                    <span className="font-semibold text-foreground">
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
              <p className="text-sm text-muted-foreground">Sin visitas registradas.</p>
            ) : (
              <ul className="divide-y">
                {data.clientesFrecuentes.map((c) => (
                  <li
                    key={c.clienteId}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span className="text-foreground">{c.nombre}</span>
                    <span className="font-semibold text-foreground">
                      {c.visitas} visitas
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fase E4 — Transaction Engine (últimos 30 días) */}
      {tx && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Transacciones (últimos 30 días)</h2>
            <p className="text-sm text-muted-foreground">
              Registros oficiales del motor de transacciones: cada uso genera un TX-ID auditable.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Transacciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{tx.total}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ≈ {tx.promedioDiario}/día · {tx.promedioMensual}/mes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aplicadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-success">{tx.aplicadas}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tx.total > 0 ? Math.round((tx.aplicadas / tx.total) * 100) : 0}% del total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Canceladas / revertidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {tx.canceladas + tx.revertidas}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tx.errores} con error · {tx.reimpresiones} reimpresiones
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tiempo de atención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {tx.tiempoPromedioMs != null ? `${(tx.tiempoPromedioMs / 1000).toFixed(1)}s` : '—'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">promedio por operación</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {(
              [
                { titulo: 'Servicios más usados', items: tx.topServicios, vacio: 'Sin servicios registrados.' },
                { titulo: 'Empleados con más operaciones', items: tx.topEmpleados, vacio: 'Sin operaciones de empleados.' },
                { titulo: 'Promociones más usadas', items: tx.topPromociones, vacio: 'Sin usos de promociones.' },
                { titulo: 'Beneficios más usados', items: tx.topBeneficios, vacio: 'Sin usos de beneficios.' },
              ] as const
            ).map((b) =>
              b.items.length === 0 && (b.titulo.startsWith('Promociones') || b.titulo.startsWith('Beneficios')) ? null : (
                <Card key={b.titulo}>
                  <CardHeader>
                    <CardTitle>{b.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {b.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{b.vacio}</p>
                    ) : (
                      <ul className="divide-y">
                        {b.items.map((i) => (
                          <li key={i.nombre} className="flex justify-between py-2 text-sm">
                            <span className="truncate text-foreground">{i.nombre}</span>
                            <span className="ml-3 shrink-0 font-semibold text-foreground">{i.usos}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Membresías por vencer (próximos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.membresiasPorVencer.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay membresías por vencer.
            </p>
          ) : (
            <ul className="divide-y">
              {data.membresiasPorVencer.map((m) => (
                <li key={m.id} className="flex justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{m.cliente}</p>
                    <p className="text-muted-foreground">{m.plan}</p>
                  </div>
                  <span className="text-muted-foreground">
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
