import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCampanaBySlug } from '@/modules/invitaciones/queries'
import { absoluteUrl } from '@/lib/site'
import { shareMetadata } from '@/lib/share/metadata'
import { normalizeInvitaContenido } from '@/lib/invitaContenido'
import { CampanaLandingScreen } from '@/components/invitaciones/CampanaLandingScreen'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const campana = await getCampanaBySlug(slug)
  if (!campana) return {}

  // Share Engine: la config de "Compartir" del editor tiene prioridad sobre
  // los datos base de la campaña. La imagen la genera opengraph-image.tsx de
  // esta misma ruta (tarjeta de marca dinámica): Next inyecta solo og:image y
  // twitter:image, así que NO se declara aquí para evitar duplicados.
  const compartir = normalizeInvitaContenido(campana.contenido)
  const title = compartir.ogTitulo || campana.titulo

  return {
    ...shareMetadata({
      title,
      description: compartir.ogDescripcion || campana.descripcion,
      url: absoluteUrl(`/invita/${slug}`),
      siteName: campana.company.name,
    }),
    title: `${title} — ${campana.company.name}`,
  }
}

export default async function CampanaLandingPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const campana = await getCampanaBySlug(slug)

  if (!campana || campana.estado === 'BORRADOR') notFound()

  return <CampanaLandingScreen campana={campana} refCode={sp.ref ?? ''} />
}
