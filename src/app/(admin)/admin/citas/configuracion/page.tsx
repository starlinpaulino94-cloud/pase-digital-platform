import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { getAgendaConfig } from '@/modules/citas/queries'
import { PageHeader } from '@/components/ui/page-header'
import { AgendaConfigForm } from '@/components/citas/AgendaConfigForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Configuración de citas' }

export default async function ConfiguracionCitasPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user) ?? user.metadata.companyId ?? null

  if (!companyId) {
    return (
      <PageHeader
        title="Configuración de citas"
        description="Selecciona una empresa activa."
      />
    )
  }

  const config = await getAgendaConfig(companyId)

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/citas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Citas
      </Link>

      <PageHeader
        title="Configuración de la agenda"
        description="Define cuántas citas aceptas por turno y por día, tu horario semanal y las reglas de reserva. Los cambios aplican de inmediato."
      />

      <AgendaConfigForm config={config} />
    </div>
  )
}
