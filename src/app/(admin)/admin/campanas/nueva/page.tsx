import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { CampanaForm } from '@/components/admin/CampanaForm'

export default async function NuevaCampanaPage() {
  await requireRole(ADMIN_ROLES)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nueva campaña</h1>
        <p className="text-muted-foreground">
          Después de crearla podrás asignarle promociones y publicaciones desde
          sus formularios.
        </p>
      </div>
      <CampanaForm />
    </div>
  )
}
