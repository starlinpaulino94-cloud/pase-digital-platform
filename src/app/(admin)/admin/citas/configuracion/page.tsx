import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { getAgendaConfig } from '@/modules/citas/queries'
import { AgendaConfigForm } from '@/components/citas/AgendaConfigForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Configuración de citas' }

export default async function ConfiguracionCitasPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user) ?? user.metadata.companyId ?? null

  if (!companyId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Configuración de citas</h1>
        <p className="text-muted-foreground">Selecciona una empresa activa.</p>
      </div>
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

      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración de la agenda</h1>
        <p className="text-muted-foreground">
          Define cuántas citas aceptas por turno y por día, tu horario semanal y
          las reglas de reserva. Los cambios aplican de inmediato.
        </p>
      </div>

      <AgendaConfigForm config={config} />
    </div>
  )
}
