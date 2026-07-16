import { getCampanaPorCodigoInvitacion } from '@/modules/invitaciones/queries'
import {
  arteDeCampana,
  campanaOgResponse,
  genericOgResponse,
  OG_SIZE,
} from '@/modules/invitaciones/ogCard'
import { originalImageResponse } from '@/lib/share/og'

// Vista previa (Open Graph) del enlace corto personal /invitar/[code]: misma
// tarjeta grande de marca que /invita/[slug] (diseño en ogCard.tsx). Es lo que
// WhatsApp/Facebook muestran al compartir el enlace de un cliente.
export const runtime = 'nodejs'
export const revalidate = 3600
export const alt = 'Invitación en MembeGo'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const res = await getCampanaPorCodigoInvitacion(code).catch(() => null)
  if (!res) return genericOgResponse()

  // Con foto oficial ligera se entrega la foto (tarjeta GRANDE en WhatsApp);
  // sin foto (o foto pesada), la tarjeta compuesta con los colores de campaña.
  const arte = arteDeCampana(res.campana)
  if (arte) {
    const original = await originalImageResponse(arte)
    if (original) return original
  }
  return campanaOgResponse(res.campana)
}
