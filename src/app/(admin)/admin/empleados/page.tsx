export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { listAllEmployees } from '@/modules/empleados/queries'
import { listAllCompanies } from '@/modules/empresas/queries'
import { EmployeeStatusBadge } from '@/components/employees/EmployeeStatusBadge'
import { EmployeeRoleBadge } from '@/components/employees/EmployeeRoleBadge'
import { EmployeeStatusButton } from '@/components/employees/EmployeeStatusButton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  searchParams: Promise<{ companyId?: string }>
}

export default async function AdminEmpleadosPage({ searchParams }: Props) {
  await requireSuperAdmin()
  const { companyId } = await searchParams

  const [{ items: employees, total }, { items: companies }] = await Promise.all([
    listAllEmployees({ companyId }),
    listAllCompanies(),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Empleados</h1>
          <p className="text-sm text-muted-foreground">{total} empleado{total !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild>
          <Link href="/admin/empleados/nuevo">+ Nuevo empleado</Link>
        </Button>
      </div>

      {/* Filter by company */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={!companyId ? 'default' : 'outline'} size="sm" asChild>
          <Link href="/admin/empleados">Todas</Link>
        </Button>
        {companies.map((c) => (
          <Button
            key={c.id}
            variant={companyId === c.id ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link href={`/admin/empleados?companyId=${c.id}`}>{c.name}</Link>
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay empleados registrados.
                </TableCell>
              </TableRow>
            )}
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.user.name}</TableCell>
                <TableCell className="text-sm">{emp.user.email}</TableCell>
                <TableCell>{emp.company?.name ?? ''}</TableCell>
                <TableCell>{emp.branch?.name ?? ''}</TableCell>
                <TableCell><EmployeeRoleBadge role={emp.role} /></TableCell>
                <TableCell><EmployeeStatusBadge status={emp.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/empleados/${emp.id}/editar`}>Editar</Link>
                  </Button>
                  <EmployeeStatusButton employeeId={emp.id} currentStatus={emp.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
