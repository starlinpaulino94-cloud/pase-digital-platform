import { requireRole } from '@/lib/auth/guards'
import { SucursalForm } from '@/components/admin/SucursalForm'

export default async function NuevaSucursalPage() {
  await requireRole(['ADMIN_EMPRESA', 'SUPERADMIN'])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nueva sucursal</h1>
        <p className="text-sm text-muted-foreground">
          Las sucursales activas aparecen en el escáner del empleado.
        </p>
      </div>
      <SucursalForm />
    </div>
  )
}
