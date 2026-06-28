export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { listAllCompanies } from '@/modules/empresas/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  await requireSuperAdmin()
  const { total: totalCompanies } = await listAllCompanies()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Panel PASE — Superadmin</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Empresas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold">{totalCompanies}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/empresas">Gestionar empresas</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Empleados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/empleados">Ver empleados</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/clientes">Ver clientes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
