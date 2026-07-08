import Link from 'next/link'
import { Building2, Users, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function SuperadminDashboard() {
  await requireRole('SUPERADMIN')

  // 3 queries totales (antes 1 + 2 por empresa): los conteos de membresías
  // salen de un solo groupBy por companyId/estado.
  const [companies, membershipCounts] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, slug: true, type: true, isActive: true,
        _count: { select: { clientes: true, plans: true } },
      },
    }),
    prisma.membership
      .groupBy({
        by: ['companyId', 'estado'],
        where: { estado: { in: ['ACTIVA', 'PENDIENTE_PAGO'] } },
        _count: { _all: true },
      })
      .catch(() => []),
  ])

  const countFor = (companyId: string, estado: string) =>
    membershipCounts.find((g) => g.companyId === companyId && g.estado === estado)
      ?._count._all ?? 0

  const perCompany = companies.map((c) => ({
    ...c,
    activas: countFor(c.id, 'ACTIVA'),
    pendientes: countFor(c.id, 'PENDIENTE_PAGO'),
  }))

  const totalClientes = perCompany.reduce((s, c) => s + c._count.clientes, 0)
  const totalActivas = perCompany.reduce((s, c) => s + c.activas, 0)
  const totalPendientes = perCompany.reduce((s, c) => s + c.pendientes, 0)

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Superadmin</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Resumen general</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Empresas" value={companies.length} icon={Building2} accent="sky" />
        <StatCard label="Clientes totales" value={totalClientes} icon={Users} accent="indigo" />
        <StatCard label="Membresías activas" value={totalActivas} icon={CheckCircle2} accent="green" />
        <StatCard
          label="Pagos pendientes"
          value={totalPendientes}
          icon={Clock}
          accent="amber"
          sub={totalPendientes > 0 ? 'Requieren revisión' : 'Sin pendientes'}
        />
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">Por empresa</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {perCompany.map((c) => (
            <Card key={c.id} className="border-border/60 shadow-card transition hover:shadow-card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <div className="flex gap-2">
                    {c.pendientes > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        {c.pendientes} pendiente{c.pendientes !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs capitalize">
                      {c.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Clientes', value: c._count.clientes },
                    { label: 'Planes', value: c._count.plans },
                    { label: 'Activas', value: c.activas },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-muted/40 py-3">
                      <p className="text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {c.pendientes > 0 && (
                  <Link href="/admin/pagos" className="mt-3 flex items-center justify-end gap-1 text-xs text-amber-600 hover:underline">
                    Ver pagos pendientes <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
