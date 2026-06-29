export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { listEmployeesByCompany } from '@/modules/empleados/queries'
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

export default async function EmpleadosPage() {
  const user = await requireRole('ADMIN_EMPRESA')

  const employees = await listEmployeesByCompany(user.companyId!)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Empleados</h1>
          <p className="text-sm text-muted-foreground">
            {employees.length} empleado{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/empleados/nuevo">+ Nuevo empleado</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay empleados registrados.
                </TableCell>
              </TableRow>
            )}
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.user.name}</TableCell>
                <TableCell className="text-sm">{emp.user.email}</TableCell>
                <TableCell>{emp.branch?.name ?? ''}</TableCell>
                <TableCell><EmployeeRoleBadge role={emp.role} /></TableCell>
                <TableCell><EmployeeStatusBadge status={emp.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/empleados/${emp.id}/editar`}>Editar</Link>
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
