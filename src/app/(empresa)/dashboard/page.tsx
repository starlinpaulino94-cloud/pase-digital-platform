export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { listCompanyPromotions } from '@/modules/promociones/queries'
import { listCustomersByCompany } from '@/modules/clientes/queries'
import { listCompanyAssignments } from '@/modules/asignaciones/queries'
import { listCompanyValidations } from '@/modules/validacion-qr/queries'
import { getValidacionesPorDia, getAsignacionesPorEstado } from '@/modules/reportes/queries'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { ValidacionesChart } from '@/components/charts/ValidacionesChart'
import { AsignacionesDonut } from '@/components/charts/AsignacionesDonut'

export default async function DashboardPage() {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')
  const companyId = user.companyId!

  const [
    { total: totalPromotions },
    { total: totalClientes },
    { total: totalAsignacionesActivas },
    { total: totalValidaciones },
    { total: totalValidacionesHoy },
    { total: totalPendingPayment },
    validacionesPorDia,
    asignacionesPorEstado,
  ] = await Promise.all([
    listCompanyPromotions(companyId, { status: 'ACTIVE' }),
    listCustomersByCompany(companyId),
    listCompanyAssignments(companyId, { status: 'ACTIVE' }),
    listCompanyValidations(companyId),
    listCompanyValidations(companyId, {
      fromDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    }),
    listCompanyAssignments(companyId, { status: 'PENDING_PAYMENT' }),
    getValidacionesPorDia(companyId, 7),
    getAsignacionesPorEstado(companyId),
  ])

  const canManage = user.role === 'ADMIN_EMPRESA' || user.role === 'SUPERADMIN'

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Panel de empresa</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Resumen de actividad</p>
        </div>
        {canManage && (
          <Button size="sm" asChild>
            <Link href="/dashboard/promociones/nueva">Nueva promoción</Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Promociones activas"
          value={totalPromotions}
          accent="blue"
          sub="en este momento"
        />
        <StatCard
          label="Clientes"
          value={totalClientes}
          accent="purple"
          sub="registrados"
        />
        <StatCard
          label="Asignaciones activas"
          value={totalAsignacionesActivas}
          accent="green"
          sub="en curso"
        />
        <StatCard
          label="Validaciones hoy"
          value={totalValidacionesHoy}
          accent="amber"
          sub={`${totalValidaciones} en total`}
        />
      </div>

      {/* Pending payment alert */}
      {canManage && totalPendingPayment > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {totalPendingPayment} asignación{totalPendingPayment !== 1 ? 'es' : ''} pendiente{totalPendingPayment !== 1 ? 's' : ''} de pago
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Requieren confirmación manual</p>
          </div>
          <Button size="sm" variant="outline" asChild className="border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40">
            <Link href="/dashboard/asignaciones">Ver pendientes</Link>
          </Button>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ValidacionesChart data={validacionesPorDia} titulo="Validaciones — últimos 7 días" />
        <AsignacionesDonut data={asignacionesPorEstado} />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Acciones rápidas</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/validaciones">Escanear QR</Link>
            </Button>
            {canManage && (
              <>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/clientes/nuevo">Nuevo cliente</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/promociones/nueva">Nueva promoción</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/clientes">Ver clientes</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Actividad reciente</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Validaciones hoy</span>
              <span className="font-medium text-foreground">{totalValidacionesHoy}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Asignaciones activas</span>
              <span className="font-medium text-foreground">{totalAsignacionesActivas}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total validaciones</span>
              <span className="font-medium text-foreground">{totalValidaciones}</span>
            </div>
          </div>
          <Button size="sm" variant="ghost" asChild className="w-full">
            <Link href="/dashboard/validaciones">Ver historial →</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
