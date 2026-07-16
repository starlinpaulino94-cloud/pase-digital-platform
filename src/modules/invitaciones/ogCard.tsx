import {
  OG_SIZE,
  genericOgResponse as genericShareCard,
  shareCardResponse,
} from '@/lib/share/og'
import { normalizeInvitaContenido } from '@/lib/invitaContenido'

/**
 * Tarjeta de vista previa (Open Graph) de una campaña "Invita y Gana",
 * compartida por las rutas que la sirven: /invita/[slug] y el enlace corto
 * personal /invitar/[code]. Construida sobre el Share Engine
 * (src/lib/share/og.tsx); la configuración de compartir de la campaña
 * (título/imagen OG del editor) tiene prioridad sobre los datos base.
 */

export { OG_SIZE }

export interface CampanaOgData {
  titulo: string
  colorPrimario: string | null
  colorSecundario: string | null
  beneficioInvitado: unknown
  /** Arte subido por el admin: si existe, es el fondo de la tarjeta. */
  bannerUrl?: string | null
  imagenUrl?: string | null
  company?: { name: string } | null
  /** JSON de contenido editable (incluye la sección Compartir). */
  contenido?: unknown
}

/** Tarjeta genérica de marca (código inválido / campaña inexistente). */
export function genericOgResponse() {
  return genericShareCard('Has recibido una invitación exclusiva')
}

/**
 * Arte oficial de la campaña para la vista previa, en orden de prioridad:
 * imagen de compartir del contenido → imagen OG → banner del landing.
 */
export function arteDeCampana(campana: CampanaOgData): string | null {
  const compartir = normalizeInvitaContenido(campana.contenido)
  return compartir.shareImagenUrl || campana.imagenUrl || campana.bannerUrl || null
}

/**
 * Tarjeta de campaña. Prioridad del arte: imagen de compartir del contenido →
 * imagen OG de la campaña → banner del landing → degradado con sus colores.
 */
export async function campanaOgResponse(campana: CampanaOgData) {
  const compartir = normalizeInvitaContenido(campana.contenido)

  const beneficio = campana.beneficioInvitado as {
    valor?: string
    descripcion?: string
  } | null
  const regalo = (beneficio?.descripcion || beneficio?.valor || '').slice(0, 80)

  return shareCardResponse({
    empresa: campana.company?.name ?? null,
    titulo: compartir.ogTitulo || campana.titulo,
    subtitulo: 'Has recibido una invitación exclusiva',
    destacado: regalo,
    footer: 'Regístrate gratis y reclama tu regalo',
    imagenUrl: compartir.shareImagenUrl || campana.imagenUrl || campana.bannerUrl,
    colorPrimario: campana.colorPrimario,
    colorSecundario: campana.colorSecundario,
  })
}
