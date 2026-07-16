import { getCompanyPublic } from '@/modules/marketplace/cached'
import {
  shareCardResponse,
  genericOgResponse,
  originalImageResponse,
  OG_SIZE,
} from '@/lib/share/og'

// Share Engine · vista previa enriquecida al compartir el perfil público de
// una empresa: su banner oficial es el fondo de la tarjeta; sin banner,
// degradado de marca. Reemplaza el logo crudo (pequeño y cuadrado) que antes
// se usaba como og:image.
export const runtime = 'nodejs'
export const revalidate = 3600
export const alt = 'Empresa en MembeGo'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const company = await getCompanyPublic(companySlug).catch(() => null)
  if (!company) return genericOgResponse('Descubre negocios con beneficios')

  // Con banner oficial ligero se entrega el banner (tarjeta GRANDE en
  // WhatsApp); el logo NO se sirve crudo (pequeño/cuadrado): se compone.
  if (company.bannerUrl) {
    const original = await originalImageResponse(company.bannerUrl)
    if (original) return original
  }

  const ubicacion = [company.ciudad, company.provincia].filter(Boolean).join(', ')

  return shareCardResponse({
    badge: 'Empresa',
    titulo: company.name,
    subtitulo: ubicacion || null,
    destacado:
      company.activePromotionsCount > 0
        ? `${company.activePromotionsCount} promoción${company.activePromotionsCount !== 1 ? 'es' : ''} activa${company.activePromotionsCount !== 1 ? 's' : ''}`
        : 'Membresías y beneficios',
    footer: 'Síguela en MembeGo',
    imagenUrl: company.bannerUrl || company.logoUrl,
  })
}
