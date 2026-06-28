export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { getEmployeeById } from '@/modules/empleados/queries'
import { EmployeeStatusBadge } from '@/components/employees/EmployeeStatusBadge'
import { EmployeeRoleBadge } from '@/components/employees/EmployeeRoleBadge'
import { EmployeeStatusButton } from '@/components/employees/EmployeeStatusButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function EmpleadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole('ADMIN_EMPRESA')
  const { id } = await params

  const employee = await getEmployeeById(id)
  if (!employee || employee.companyId !== user.companyId) notFound()

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/empleados">←</Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{employee.user.name}</h1>
          <EmployeeStatusBadge status={employee.status} />
          <EmployeeRoleBadge role={employee.role} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Información</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <Row label="Email" value={employee.user.email} />
          <Row label="Teléfono" value={employee.user.phone} />
          <Row label="Sucursal" value={employee.branch?.name} />
          <Row label="Desde" value={new Date(employee.createdAt).toLocaleDateString('es-DO')} />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/empleados/${id}/editar`}>Editar</Link>
        </Button>
        <EmployeeStatusButton employeeId={id} currentStatus={employee.status} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  )
}
