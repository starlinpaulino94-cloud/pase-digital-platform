import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { NuevoEmpleadoForm } from '@/components/admin/EmpleadoForms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function NuevoEmpleadoPage() {
  await requireRole(ADMIN_ROLES)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/admin/empleados"
        className="text-sm text-sky-600 hover:underline"
      >
        ← Volver a empleados
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <NuevoEmpleadoForm />
        </CardContent>
      </Card>
    </div>
  )
}
