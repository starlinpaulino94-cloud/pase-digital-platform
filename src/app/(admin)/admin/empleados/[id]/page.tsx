export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { getEmployeeById } from '@/modules/empleados/queries'
import { EmployeeStatusBadge } from '@/components/employees/EmployeeStatusBadge'
import { EmployeeRoleBadge } from '@/components/employees/EmployeeRoleBadge'
import { EmployeeStatusButton } from '@/components/employees/EmployeeStatusButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperAdmin()
  const { id } = await params

  const employee = await getEmployeeById(id)
  if (!employee) notFound()

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/empleados">←</Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{employee.user.name}</h1>
            <EmployeeStatusBadge status={employee.status} />
            <EmployeeRoleBadge role={employee.role} />
          </div>
          <p className="text-sm text-muted-foreground">{employee.user.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Datos del empleado</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {employee.user.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teléfono</span>
                <span>{employee.user.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empresa</span>
              <span>{employee.company?.name ?? ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sucursal</span>
              <span>{employee.branch?.name ?? 'Sin asignar'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alta</span>
              <span>{new Date(employee.createdAt).toLocaleDateString('es-DO')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Acciones</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/admin/empleados/${id}/editar`}>Editar empleado</Link>
            </Button>
            <EmployeeStatusButton
              employeeId={employee.id}
              currentStatus={employee.status}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
