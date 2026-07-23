import { OG_SIZE, shareCardResponse } from '@/lib/share/og'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Tienes un regalo esperándote en MembeGo'

/**
 * Share Engine · tarjeta de las ofertas VIP (/oferta/[codigo]).
 *
 * IMPORTANTE: el contenido del regalo es PRIVADO (lista cerrada, se resuelve
 * por cuenta), así que la tarjeta no consulta la BD ni revela el beneficio:
 * vende el misterio ("tienes un regalo") con la marca — igual que un sobre
 * cerrado. Antes este enlace se compartía como texto plano.
 */
export default async function Image() {
  return shareCardResponse({
    badge: 'Regalo exclusivo',
    subtitulo: 'Alguien pensó en ti',
    titulo: '🎁 Tienes un regalo esperándote',
    footer: 'Ábrelo con tu cuenta para reclamarlo',
    colorPrimario: '#6D28D9',
    colorSecundario: '#0D9488',
  })
}
