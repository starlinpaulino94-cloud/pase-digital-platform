import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { resolveCompanyId } from '@/lib/auth/company-context'
import { getEngagementConfig } from '@/modules/engagement/config'
import { PageHeader } from '@/components/ui/page-header'
import { PersonalizacionForm } from '@/components/admin/PersonalizacionForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Personalización' }

export default async function AdminPersonalizacionPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = await resolveCompanyId(user)
  if (!companyId) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Selecciona una empresa para personalizar su experiencia.
      </div>
    )
  }

  const config = await getEngagementConfig(companyId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalización"
        description="Ajusta el color de acento y elige qué módulos del motor de engagement ve tu cliente en el inicio."
      />
      <PersonalizacionForm config={config} />
    </div>
  )
}
