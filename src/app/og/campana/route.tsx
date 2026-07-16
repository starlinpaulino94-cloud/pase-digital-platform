import type { NextRequest } from 'next/server'
import { getCampanaBySlug, getCampanaPorCodigoInvitacion } from '@/modules/invitaciones/queries'
import { campanaOgResponse, genericOgResponse } from '@/modules/invitaciones/ogCard'

/**
 * Share Engine · tarjeta compuesta de campaña para campañas SIN imagen
 * oficial: /og/campana?slug=… o /og/campana?code=…
 *
 * Vive fuera de /api a propósito: robots.txt bloquea /api y el crawler de
 * Meta (WhatsApp/Facebook) respeta robots — una og:image bajo /api jamás se
 * mostraría. Con imagen oficial, la metadata apunta directo al CDN y esta
 * ruta ni se usa.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const code = req.nextUrl.searchParams.get('code')

  try {
    if (slug) {
      const campana = await getCampanaBySlug(slug)
      if (campana) return campanaOgResponse(campana)
    } else if (code) {
      const res = await getCampanaPorCodigoInvitacion(code)
      if (res) return campanaOgResponse(res.campana)
    }
  } catch (e) {
    console.error('[og/campana]', e)
  }
  return genericOgResponse()
}
