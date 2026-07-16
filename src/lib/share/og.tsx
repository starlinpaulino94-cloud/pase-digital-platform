import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/site'

/**
 * Share Engine · tarjeta de vista previa (Open Graph / Twitter Card) genérica.
 *
 * Cualquier entidad compartible (promoción, plan/membresía, empresa, campaña,
 * invitación) genera su tarjeta 1200×630 con este componente: si tiene imagen
 * oficial, es el FONDO de la tarjeta (con velo para legibilidad); si no, un
 * degradado con los colores de la entidad. Así todo enlace de MembeGo se ve
 * como una tarjeta visual completa en WhatsApp/Facebook/Telegram/X, nunca como
 * texto plano.
 */

export const OG_SIZE = { width: 1200, height: 630 }

export interface ShareCardData {
  /** Categoría del enlace (Promoción · Membresía · Empresa · Invitación). */
  badge?: string | null
  /** Nombre del negocio (chip superior derecha). */
  empresa?: string | null
  titulo: string
  /** Frase corta sobre el título (ej: "Has recibido una invitación exclusiva"). */
  subtitulo?: string | null
  /** Dato protagonista en pastilla blanca (descuento, precio, regalo). */
  destacado?: string | null
  /** Línea de cierre (ej: "Regístrate gratis y reclama tu regalo"). */
  footer?: string | null
  /** Imagen oficial: fondo de la tarjeta. */
  imagenUrl?: string | null
  colorPrimario?: string | null
  colorSecundario?: string | null
}

/** Formatos que satori (next/og) rasteriza de forma fiable. */
const OG_IMG_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']

/**
 * Descarga la imagen y la devuelve como data URL para incrustarla en la
 * tarjeta. Se hace aquí (y no dejando que satori haga el fetch) para poder
 * controlar timeout, tamaño y formato: cualquier problema → null y la
 * tarjeta cae al diseño degradado, nunca a una imagen rota.
 */
export async function fetchImageDataUrl(url: string, timeoutMs = 4000): Promise<string | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const tipo = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    if (!OG_IMG_TYPES.includes(tipo)) return null
    const buf = Buffer.from(await res.arrayBuffer())
    // Imágenes desmedidas harían lenta la vista previa (WhatsApp corta ~5s).
    if (buf.length === 0 || buf.length > 4_000_000) return null
    return `data:${tipo};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * Sirve la imagen ORIGINAL de la entidad como respuesta del endpoint
 * opengraph-image. WhatsApp solo muestra la tarjeta GRANDE si la imagen pesa
 * menos de ~600 KB: un JPEG subido por el negocio pasa; un PNG compuesto con
 * foto de fondo casi nunca. Por eso, con foto oficial se entrega la foto
 * (como hace Temu) y la tarjeta compuesta queda para entidades sin foto.
 * Devuelve null si la imagen no es apta (formato/tamaño/timeout) para que el
 * llamador caiga a la tarjeta compuesta.
 */
export async function originalImageResponse(url: string, timeoutMs = 4000): Promise<Response | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const tipo = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(tipo)) return null
    const buf = Buffer.from(await res.arrayBuffer())
    // >600 KB: WhatsApp degrada a miniatura — mejor la tarjeta compuesta.
    if (buf.length === 0 || buf.length > 600_000) return null
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': tipo,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch {
    return null
  }
}

export function MembeGoMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width="48" height="48" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="l" x1="104" y1="148" x2="104" y2="424" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="r" x1="408" y1="148" x2="408" y2="424" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
          <linearGradient id="v" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path d="M104 148 L104 424" stroke="url(#l)" strokeWidth="88" strokeLinecap="round" fill="none" />
        <path d="M408 148 L408 424" stroke="url(#r)" strokeWidth="88" strokeLinecap="round" fill="none" />
        <path d="M104 148 L256 308 L408 148" stroke="url(#v)" strokeWidth="88" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span style={{ fontSize: 36, fontWeight: 800, color: '#FFFFFF', letterSpacing: -1 }}>
        {SITE_NAME}
      </span>
    </div>
  )
}

/** Tarjeta genérica de marca (entidad inexistente o enlace inválido). */
export function genericOgResponse(subtitulo = 'Conecta. Disfruta. Ahorra.') {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6D28D9 0%, #3B82F6 50%, #0D9488 100%)',
          color: 'white',
        }}
      >
        <span style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2 }}>{SITE_NAME}</span>
        <span style={{ fontSize: 34, marginTop: 12, opacity: 0.92 }}>{subtitulo}</span>
      </div>
    ),
    OG_SIZE
  )
}

/** Chips superiores (marca + badge de categoría + empresa). */
function CardHeader({ badge, empresa }: { badge?: string | null; empresa?: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <MembeGoMark />
        {badge ? (
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#FFFFFF',
              background: 'rgba(255,255,255,0.22)',
              padding: '8px 20px',
              borderRadius: 999,
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      {empresa ? (
        <span
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'rgba(255,255,255,0.22)',
            padding: '10px 22px',
            borderRadius: 999,
            maxWidth: 420,
            overflow: 'hidden',
          }}
        >
          {empresa}
        </span>
      ) : null}
    </div>
  )
}

/**
 * Tarjeta de compartición de cualquier entidad. Si trae imagen oficial, es el
 * FONDO (con degradado para que el texto se lea); si no, diseño degradado con
 * los colores de la entidad.
 */
export async function shareCardResponse(data: ShareCardData) {
  const primary = data.colorPrimario || '#10b981'
  const secondary = data.colorSecundario || '#059669'
  const titulo = (data.titulo || '').slice(0, 90)
  const subtitulo = (data.subtitulo || '').slice(0, 90)
  const destacado = (data.destacado || '').slice(0, 80)
  const footer = (data.footer || '').slice(0, 90)

  const fondo = data.imagenUrl ? await fetchImageDataUrl(data.imagenUrl) : null

  if (fondo) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            position: 'relative',
            backgroundColor: '#0f172a',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fondo}
            alt=""
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Velo para que el texto se lea sobre cualquier arte. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              background:
                'linear-gradient(180deg, rgba(2,6,23,0.45) 0%, rgba(2,6,23,0.10) 45%, rgba(2,6,23,0.85) 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 56,
              color: '#FFFFFF',
            }}
          >
            <CardHeader badge={data.badge} empresa={data.empresa} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subtitulo ? (
                <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.95 }}>{subtitulo}</span>
              ) : null}
              <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.08 }}>
                {titulo}
              </span>
              {destacado ? (
                <span
                  style={{
                    display: 'flex',
                    alignSelf: 'flex-start',
                    fontSize: 32,
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#FFFFFF',
                    padding: '12px 28px',
                    borderRadius: 16,
                  }}
                >
                  {destacado}
                </span>
              ) : footer ? (
                <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.95 }}>{footer}</span>
              ) : null}
            </div>
          </div>
        </div>
      ),
      OG_SIZE
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          color: '#FFFFFF',
        }}
      >
        <CardHeader badge={data.badge} empresa={data.empresa} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {subtitulo ? (
            <span style={{ fontSize: 30, fontWeight: 600, opacity: 0.95 }}>{subtitulo}</span>
          ) : null}
          <span style={{ fontSize: 68, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05 }}>
            {titulo}
          </span>
          {destacado ? (
            <span
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                fontSize: 34,
                fontWeight: 700,
                color: primary,
                background: '#FFFFFF',
                padding: '14px 30px',
                borderRadius: 18,
                marginTop: 6,
              }}
            >
              {destacado}
            </span>
          ) : null}
        </div>

        {footer ? (
          <span style={{ fontSize: 30, fontWeight: 600, opacity: 0.95 }}>{footer}</span>
        ) : (
          <span style={{ fontSize: 30, fontWeight: 600, opacity: 0.95 }}>membego.com</span>
        )}
      </div>
    ),
    OG_SIZE
  )
}
