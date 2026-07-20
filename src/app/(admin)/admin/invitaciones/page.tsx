import Link from 'next/link'
import {
  Gift,
  Plus,
  Eye,
  Clock,
  BarChart3,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { resolveCompanyId } from '@/lib/auth/company-context'
import { getCampanasEmpresa } from '@/modules/invitaciones/queries'
import { campanaEstadoUi } from '@/lib/estados'
import { formatDate } from '@/lib/format'
import { PageHeader } from '@/components/ui/page-header'
import { SinEmpresaActiva } from '@/components/admin/SinEmpresaActiva'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CampanaEstadoButton } from '@/components/invitaciones/CampanaEstadoButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Campañas de Invitación' }

function fmtDate(d: Date) {
  return formatDate(d)
}

export default async function AdminInvitacionesPage() {
  const user = await requireRole(ADMIN_ROLES)
  // Las campañas son por empresa: un superadmin debe tener una empresa ACTIVA
  // en el selector del panel. resolveCompanyId respeta esa selección
  // (app_metadata.companyId) y verifica que exista.
  const companyId = await resolveCompanyId(user)
  if (!companyId) {
    return <SinEmpresaActiva seccion="tus campañas de Invita y Gana" />
  }

  const campanas = await getCampanasEmpresa(companyId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invita y Gana"
        description="Crea y gestiona campañas 'Invita y Gana' para que tus clientes traigan amigos."
        action={
          <div className="flex items-center gap-2">
            {/* El rendimiento del programa (referidos y reglas) vive en su
                propia vista; se enlaza aquí porque en el menú ambos se
                unificaron en "Invita y Gana" (Auditoría · Fase A). */}
            <Link href="/admin/referidos">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Rendimiento
              </Button>
            </Link>
            <Link href="/admin/invitaciones/nueva">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva campaña
              </Button>
            </Link>
          </div>
        }
      />

      {campanas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Gift className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Sin campañas</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Crea tu primera campaña de invitación para empezar a crecer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campanas.map((c) => {
            const badge = campanaEstadoUi(c.estado)
            return (
              <Card key={c.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{c.nombre}</h3>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{c.titulo}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {fmtDate(c.fechaInicio)} — {fmtDate(c.fechaFin)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-center shrink-0">
                      <div>
                        <p className="text-lg font-bold text-foreground">{c._count.progresos}</p>
                        <p className="text-xs text-muted-foreground">Participantes</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{c._count.eventos}</p>
                        <p className="text-xs text-muted-foreground">Eventos</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{c._count.referidos}</p>
                        <p className="text-xs text-muted-foreground">Referidos</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <CampanaEstadoButton id={c.id} estado={c.estado} />
                      <Link href={`/admin/invitaciones/${c.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
