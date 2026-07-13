import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/site'

/**
 * Tarjeta de vista previa (Open Graph) de una campaña "Invita y Gana",
 * compartida por las dos rutas que la sirven: /invita/[slug] y el enlace
 * corto personal /invitar/[code]. Así CUALQUIER enlace compartido por
 * WhatsApp/Facebook/etc. muestra la misma tarjeta grande de marca.
 */

export const OG_SIZE = { width: 1200, height: 630 }

export interface CampanaOgData {
  titulo: string
  colorPrimario: string | null
  colorSecundario: string | null
  beneficioInvitado: unknown
  /** Arte subido por el admin: si existe, es el fondo de la tarjeta. */
  bannerUrl?: string | null
  imagenUrl?: string | null
  company?: { name: string } | null
}

/** Formatos que satori (next/og) rasteriza de forma fiable. */
const OG_IMG_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']

/**
 * Descarga el banner y lo devuelve como data URL para incrustarlo en la
 * tarjeta. Se hace aquí (y no dejando que satori haga el fetch) para poder
 * controlar timeout, tamaño y formato: cualquier problema → null y la
 * tarjeta cae al diseño degradado, nunca a una imagen rota.
 */
async function fetchBannerDataUrl(url: string, timeoutMs = 4000): Promise<string | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const tipo = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    if (!OG_IMG_TYPES.includes(tipo)) return null
    const buf = Buffer.from(await res.arrayBuffer())
    // Banners desmedidos harían lenta la vista previa (WhatsApp corta ~5s).
    if (buf.length === 0 || buf.length > 4_000_000) return null
    return `data:${tipo};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

function MembeGoMark() {
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

/** Tarjeta genérica de marca (código inválido / campaña inexistente). */
export function genericOgResponse() {
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
        <span style={{ fontSize: 34, marginTop: 12, opacity: 0.92 }}>
          Has recibido una invitación exclusiva
        </span>
      </div>
    ),
    OG_SIZE
  )
}

/**
 * Tarjeta de campaña. Si el admin subió un banner/imagen, ese arte es el
 * FONDO de la tarjeta (con degradado para legibilidad del texto); si no,
 * se genera el diseño degradado con los colores de la campaña.
 */
export async function campanaOgResponse(campana: CampanaOgData) {
  const primary = campana.colorPrimario || '#10b981'
  const secondary = campana.colorSecundario || '#059669'
  const empresa = campana.company?.name ?? SITE_NAME
  const titulo = (campana.titulo || '').slice(0, 90)

  const beneficio = campana.beneficioInvitado as {
    valor?: string
    descripcion?: string
  } | null
  const regalo = (beneficio?.descripcion || beneficio?.valor || '').slice(0, 80)

  const arte = campana.bannerUrl || campana.imagenUrl
  const fondo = arte ? await fetchBannerDataUrl(arte) : null

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <MembeGoMark />
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: 'rgba(255,255,255,0.22)',
                  padding: '10px 22px',
                  borderRadius: 999,
                }}
              >
                {empresa}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.08 }}>
                {titulo}
              </span>
              {regalo ? (
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
                  {regalo}
                </span>
              ) : (
                <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.95 }}>
                  Regístrate gratis y reclama tu regalo
                </span>
              )}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <MembeGoMark />
          <span
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: '#FFFFFF',
              background: 'rgba(255,255,255,0.18)',
              padding: '10px 22px',
              borderRadius: 999,
            }}
          >
            {empresa}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span style={{ fontSize: 30, fontWeight: 600, opacity: 0.95 }}>
            Has recibido una invitación exclusiva
          </span>
          <span style={{ fontSize: 68, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05 }}>
            {titulo}
          </span>
          {regalo ? (
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
              {regalo}
            </span>
          ) : null}
        </div>

        <span style={{ fontSize: 30, fontWeight: 600, opacity: 0.95 }}>
          Regístrate gratis y reclama tu regalo
        </span>
      </div>
    ),
    OG_SIZE
  )
}
