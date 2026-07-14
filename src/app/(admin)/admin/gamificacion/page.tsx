import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { resolveCompanyId } from '@/lib/auth/company-context'
import { getRuletaPremiosAdmin } from '@/modules/engagement/ruleta'
import { COSTO_RULETA } from '@/lib/gamificacion'
import { PageHeader } from '@/components/ui/page-header'
import { RuletaAdmin, type PremioRow } from '@/components/gamificacion/RuletaAdmin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ruleta de premios' }

export default async function AdminGamificacionPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = await resolveCompanyId(user)
  if (!companyId) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Selecciona una empresa para configurar su ruleta.
      </div>
    )
  }

  const [premiosRaw, promociones] = await Promise.all([
    getRuletaPremiosAdmin(companyId),
    prisma.promocion.findMany({
      where: { companyId, activo: true, archivada: false },
      select: { id: true, titulo: true },
      orderBy: { titulo: 'asc' },
    }),
  ])

  const premios: PremioRow[] = premiosRaw.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    tipo: p.tipo,
    promocionId: p.promocionId,
    promocion: p.promocion,
    probabilidad: p.probabilidad,
    color: p.color,
    activo: p.activo,
    orden: p.orden,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ruleta de premios"
        description={`Tus clientes gastan ${COSTO_RULETA} puntos por giro y pueden ganar los premios que configures aquí. Los puntos se ganan usando beneficios e invitando amigos.`}
      />
      <RuletaAdmin premios={premios} promociones={promociones} />
    </div>
  )
}
