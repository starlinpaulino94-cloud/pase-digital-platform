import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCampanaBySlug } from '@/modules/invitaciones/queries'
import { registrarEventoCampana } from '@/modules/invitaciones/clienteActions'
import { absoluteUrl } from '@/lib/site'
import { CampanaLanding } from '@/components/invitaciones/CampanaLanding'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const campana = await getCampanaBySlug(slug)
  if (!campana) return {}

  const title = campana.titulo
  const description = campana.descripcion
  const image = campana.bannerUrl || campana.imagenUrl
  const url = absoluteUrl(`/invita/${slug}`)

  return {
    title: `${title} — ${campana.company.name}`,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: campana.company.name,
      type: 'website',
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function CampanaLandingPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const campana = await getCampanaBySlug(slug)

  if (!campana || campana.estado === 'BORRADOR') notFound()

  const refCode = sp.ref ?? ''
  const expirada = campana.estado === 'FINALIZADA' || new Date(campana.fechaFin) < new Date()
  const abierta = campana.estado === 'ACTIVA' && !expirada

  // Embudo: la llegada con ?ref es el clic sobre un enlace compartido;
  // la vista de landing se registra siempre (con o sin atribución).
  if (refCode) {
    await registrarEventoCampana(campana.id, 'ENLACE_ABIERTO', { slug, refCode })
  }
  await registrarEventoCampana(campana.id, 'LANDING_VISTA', {
    slug,
    ...(refCode ? { refCode } : {}),
  })

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
    />
  )
}
