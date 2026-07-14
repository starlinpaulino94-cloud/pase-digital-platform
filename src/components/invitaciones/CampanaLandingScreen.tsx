import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import type { getCampanaBySlug } from '@/modules/invitaciones/queries'
import { registrarEventoCampana } from '@/modules/invitaciones/clienteActions'
import { CampanaLanding } from '@/components/invitaciones/CampanaLanding'

export type CampanaConEmpresa = NonNullable<Awaited<ReturnType<typeof getCampanaBySlug>>>

/**
 * Cuerpo servidor de la landing de campaña, compartido por sus dos rutas:
 * /invita/[slug] (canónica) y /invitar/[code] (enlace corto personal).
 * Registra los eventos del embudo, personaliza con el nombre del invitante
 * y delega la UI en el componente cliente CampanaLanding.
 */
export async function CampanaLandingScreen({
  campana,
  refCode,
}: {
  campana: CampanaConEmpresa
  refCode: string
}) {
  const expirada = campana.estado === 'FINALIZADA' || new Date(campana.fechaFin) < new Date()
  const abierta = campana.estado === 'ACTIVA' && !expirada

  // Personalización: "Juan quiere regalarte..." — nombre del invitante a
  // partir del código de referido (corto o largo). Nunca bloquea la landing.
  let invitanteNombre: string | null = null
  if (refCode) {
    const invitante = await prisma.cliente
      .findFirst({
        where: {
          OR: [{ codigoCorto: refCode.toUpperCase() }, { codigoReferido: refCode }],
        },
        select: { nombre: true },
      })
      .catch(() => null)
    // Solo el primer nombre: suficiente para personalizar sin exponer datos.
    invitanteNombre = invitante?.nombre?.split(' ')[0] ?? null
  }

  // Contexto de auditoría de eventos: origen y dispositivo (spec Growth Engine).
  const hdrs = await headers()
  const userAgent = hdrs.get('user-agent') ?? ''
  const contexto = {
    slug: campana.slug,
    ...(refCode ? { refCode } : {}),
    origen: hdrs.get('referer') ?? 'directo',
    dispositivo: /mobile|android|iphone|ipad/i.test(userAgent) ? 'movil' : 'escritorio',
    userAgent: userAgent.slice(0, 150),
  }

  // Embudo: la llegada con ref es el clic sobre un enlace compartido;
  // la vista de landing se registra siempre (con o sin atribución).
  if (refCode) {
    await registrarEventoCampana(campana.id, 'ENLACE_ABIERTO', contexto)
  }
  await registrarEventoCampana(campana.id, 'LANDING_VISTA', contexto)

  const beneficioInvitado = campana.beneficioInvitado as {
    tipo?: string
    valor?: string
    descripcion?: string
    vigenciaDias?: number
  } | null

  return (
    <CampanaLanding
      campana={{
        id: campana.id,
        slug: campana.slug,
        titulo: campana.titulo,
        descripcion: campana.descripcion,
        textoLanding: campana.textoLanding,
        imagenUrl: campana.imagenUrl,
        bannerUrl: campana.bannerUrl,
        fechaFin: campana.fechaFin.toISOString(),
        colorPrimario: campana.colorPrimario,
        colorSecundario: campana.colorSecundario,
        usarBanner: campana.usarBanner,
        abierta,
        expirada,
        beneficioInvitado: beneficioInvitado ?? null,
        empresa: {
          name: campana.company.name,
          slug: campana.company.slug,
          logoUrl: campana.company.logoUrl,
        },
      }}
      refCode={refCode}
      invitanteNombre={invitanteNombre}
    />
  )
}
