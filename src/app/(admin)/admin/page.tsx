export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { listAllCompanies } from '@/modules/empresas/queries'
import { listAllPromotions } from '@/modules/promociones/queries'
import { listAllCustomers } from '@/modules/clientes/queries'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'

export default async function AdminPage() {
  await requireSuperAdmin()

  const [
    { total: totalCompanies },
    { total: totalEmpresasActivas },
    { total: totalPromotions },
    { total: totalPromotionsActivas },
    { total: totalClientes },
    { total: totalClientesActivos },
  ] = await Promise.all([
    listAllCompanies(),
    listAllCompanies({ status: 'ACTIVE' }),
    listAllPromotions(),
    listAllPromotions({ status: 'ACTIVE' }),
    listAllCustomers(),
    listAllCustomers({ status: 'ACTIVE' }),
  ])

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Panel de administración</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Vista global de la plataforma PASE</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Empresas"
          value={totalCompanies}
          sub={`${totalEmpresasActivas} activas · ${totalCompanies - totalEmpresasActivas} pendientes`}
          accent="blue"
        />
        <StatCard
          label="Promociones"
          value={totalPromotions}
          sub={`${totalPromotionsActivas} activas`}
          accent="purple"
        />
        <StatCard
          label="Clientes"
          value={totalClientes}
          sub={`${totalClientesActivos} activos`}
          accent="green"
        />
      </div>

      {/* Quick access */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Gestionar empresas', href: '/admin/empresas', desc: 'Activar, suspender y configurar empresas' },
          { label: 'Ver validaciones', href: '/admin/validaciones', desc: 'Historial de validaciones QR' },
          { label: 'Auditoría', href: '/admin/auditoria', desc: 'Registros de actividad del sistema' },
          { label: 'Clientes', href: '/admin/clientes', desc: 'Gestión de cuentas de clientes' },
          { label: 'Empleados', href: '/admin/empleados', desc: 'Gestión de accesos y roles' },
          { label: 'Reportes', href: '/admin/reportes', desc: 'Métricas y exportaciones CSV' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group bg-card border border-border rounded-xl p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {item.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" asChild>
          <Link href="/admin/empresas/nueva">+ Nueva empresa</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/admin/reportes/exportar">Exportar CSV</Link>
        </Button>
      </div>
    </div>
  )
}
