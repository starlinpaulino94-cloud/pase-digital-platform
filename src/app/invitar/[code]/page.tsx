import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCampanaPorCodigoInvitacion } from '@/modules/invitaciones/queries'
import { absoluteUrl } from '@/lib/site'
import { shareMetadata } from '@/lib/share/metadata'
import { normalizeInvitaContenido } from '@/lib/invitaContenido'
import { arteDeCampana } from '@/modules/invitaciones/ogCard'
import { CampanaLandingScreen } from '@/components/invitaciones/CampanaLandingScreen'

export const dynamic = 'force-dynamic'

/**
 * MVP "Invita y Gana" · Enlace corto personal: membego.com/invitar/XXXXXX.
 *
 * Renderiza la landing DIRECTAMENTE (no redirige): los robots de vista previa
 * de WhatsApp/Facebook no siguen redirecciones, así que la URL compartida
 * debe responder 200 con sus propios metadatos OG y su opengraph-image para
 * que el enlace siempre muestre la tarjeta grande con imagen.
 */
interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const res = await getCampanaPorCodigoInvitacion(code)
  if (!res) return {}

  const { campana } = res

  // Share Engine: la config de "Compartir" del editor tiene prioridad. La
  // og:image apunta DIRECTO al CDN cuando hay imagen oficial (respuesta
  // instantánea para el robot de WhatsApp); sin imagen, a /og/campana.
  const compartir = normalizeInvitaContenido(campana.contenido)
  const title = compartir.ogTitulo || campana.titulo
  const image =
    arteDeCampana(campana) ?? absoluteUrl(`/og/campana?code=${encodeURIComponent(code)}`)

  return {
    ...shareMetadata({
      title,
      description: compartir.ogDescripcion || campana.descripcion,
      url: absoluteUrl(`/invitar/${code}`),
      siteName: campana.company.name,
      image,
    }),
    title: `${title} — ${campana.company.name}`,
  }
}

export default async function InvitarCodePage({ params }: Props) {
  const { code } = await params
  const res = await getCampanaPorCodigoInvitacion(code)

  // Código desconocido o sin campaña activa: a la portada (nunca un 404 feo
  // para un enlace que alguien recibió por WhatsApp).
  if (!res) redirect('/')

  return <CampanaLandingScreen campana={res.campana} refCode={res.ref} />
}
