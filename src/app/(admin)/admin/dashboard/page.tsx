import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import {
  Users,
  CheckCircle2,
  Clock,
  CalendarCheck,
  CreditCard,
  ArrowRight,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { adminMetrics } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const user = await requireRole(ADMIN_ROLES)

  let metrics = { totalClientes: 0, activas: 0, pendientes: 0, visitasHoy: 0 }
  let company = null
  try {
    metrics = await adminMetrics(user)
    company = user.metadata.companyId
      ? await prisma.company.findUnique({ where: { id: user.metadata.companyId }, select: { id: true, name: true, slug: true, type: true } })
      : null
  } catch (e) {
    console.error('[admin-dashboard]', e)
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Panel de administración</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {company ? company.name : 'Todas las empresas'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat('es-DO', { dateStyle: 'long' }).format(new Date())}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clientes"
          value={metrics.totalClientes}
          icon={Users}
          accent="sky"
        />
        <StatCard
          label="Membresías activas"
          value={metrics.activas}
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard
          label="Pagos pendientes"
          value={metrics.pendientes}
          icon={Clock}
          accent="amber"
          sub={metrics.pendientes > 0 ? 'Requieren atención' : 'Al día'}
        />
        <StatCard
          label="Visitas hoy"
          value={metrics.visitasHoy}
          icon={CalendarCheck}
          accent="indigo"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.pendientes > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
                <Clock className="h-4 w-4" />
                Comprobantes pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-900">{metrics.pendientes}</p>
              <p className="mb-3 text-xs text-amber-700">esperando validación</p>
              <Link href="/admin/pagos">
                <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-500 text-white">
                  Revisar pagos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Métodos de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-600">
              Configura las cuentas bancarias que verán tus clientes.
            </p>
            <Link href="/admin/metodos-pago">
              <Button size="sm" variant="outline" className="gap-1.5">
                Gestionar
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Clientes recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-600">
              Administra y busca clientes por nombre o correo.
            </p>
            <Link href="/admin/clientes">
              <Button size="sm" variant="outline" className="gap-1.5">
                Ver clientes
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
