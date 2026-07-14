import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { CampanaInvitacionForm } from '@/components/invitaciones/CampanaInvitacionForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Editar campaña de invitación' }

export default async function EditarCampanaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(ADMIN_ROLES)
  const { id } = await params

  const campana = await prisma.campanaInvitacion.findUnique({ where: { id } })
  if (!campana) notFound()

  // Promociones vigentes de la empresa: candidatas a beneficio digital (E8).
  const promociones = await prisma.promocion.findMany({
    where: { companyId: campana.companyId, activo: true, archivada: false },
    select: { id: true, titulo: true },
    orderBy: { titulo: 'asc' },
  })

  const existing = {
    id: campana.id,
    nombre: campana.nombre,
    titulo: campana.titulo,
    descripcion: campana.descripcion,
    textoLanding: campana.textoLanding,
    imagenUrl: campana.imagenUrl,
    bannerUrl: campana.bannerUrl,
    metaRegistros: campana.metaRegistros,
    beneficioInvitante: campana.beneficioInvitante as {
      tipo: string
      valor: string
      descripcion: string
      vigenciaDias: number
      promocionId?: string
    },
    beneficioInvitado: campana.beneficioInvitado as {
      tipo: string
      valor: string
      descripcion: string
      vigenciaDias: number
      promocionId?: string
    },
    fechaInicio: campana.fechaInicio.toISOString(),
    fechaFin: campana.fechaFin.toISOString(),
    maxPremios: campana.maxPremios,
    colorPrimario: campana.colorPrimario,
    colorSecundario: campana.colorSecundario,
    usarBanner: campana.usarBanner,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar campaña"
        description={`Editando: ${campana.nombre}`}
      />
      <CampanaInvitacionForm existing={existing} promociones={promociones} />
    </div>
  )
}
