export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { listBranchesByCompany } from '@/modules/empresas/queries'
import { BranchStatusBadge } from '@/components/companies/BranchStatusBadge'
import { ToggleBranchButton } from '@/components/companies/ToggleBranchButton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function SucursalesPage() {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')
  const companyId = user.companyId!

  const branches = await listBranchesByCompany(companyId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sucursales</h1>
          <p className="text-sm text-muted-foreground">{branches.length} sucursal{branches.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sucursales/nueva">+ Nueva sucursal</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Empleados</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay sucursales registradas.
                </TableCell>
              </TableRow>
            )}
            {branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="font-medium">{branch.name}</TableCell>
                <TableCell>{branch.address ?? ''}</TableCell>
                <TableCell>{branch.phone ?? ''}</TableCell>
                <TableCell>{branch._count?.employees ?? 0}</TableCell>
                <TableCell>
                  <BranchStatusBadge status={branch.status} />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/sucursales/${branch.id}/editar`}>Editar</Link>
                  </Button>
                  <ToggleBranchButton branchId={branch.id} currentStatus={branch.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
