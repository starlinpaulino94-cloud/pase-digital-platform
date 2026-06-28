export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { listCompanyPromotions } from '@/modules/promociones/queries'
import { listCustomersByCompany } from '@/modules/clientes/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')
  const companyId = user.companyId!

  const [{ total: totalPromotions }, { total: totalClientes }] = await Promise.all([
    listCompanyPromotions(companyId),
    listCustomersByCompany(companyId),
  ])

  const canManage = user.role === 'ADMIN_EMPRESA' || user.role === 'SUPERADMIN'

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Promociones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold">{totalPromotions}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/promociones">Ver promociones</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold">{totalClientes}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/clientes">Ver clientes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validación QR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button size="sm" className="w-full" asChild>
              <Link href="/dashboard/validaciones">Escanear QR</Link>
            </Button>
          </CardContent>
        </Card>

        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" className="w-full" asChild>
                <Link href="/dashboard/promociones/nueva">+ Nueva promoción</Link>
              </Button>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link href="/dashboard/clientes/nuevo">+ Nuevo cliente</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
