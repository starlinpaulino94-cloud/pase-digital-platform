import { ImageResponse } from 'next/og'
import { getGrowthLanding } from '@/modules/growth/links'
import { originalImageResponse } from '@/lib/share/og'
import { SITE_NAME } from '@/lib/site'

// Growth Engine 3.0 · Vista previa enriquecida al compartir una invitación.
export const runtime = 'nodejs'
export const revalidate = 0
export const alt = 'Invitación exclusiva en MembeGo'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const data = await getGrowthLanding(code).catch(() => null)

  const referente = data?.referente ?? 'Un amigo'
  const empresa = data?.empresa.name ?? SITE_NAME
  const beneficio = data?.beneficio?.titulo ?? 'un beneficio exclusivo'
  const imagen = data?.beneficio?.imagenUrl ?? null

  // Con imagen oficial ligera se entrega la imagen (tarjeta GRANDE en
  // WhatsApp); si no, la tarjeta compuesta con el beneficio y quien invita.
  if (imagen) {
    const original = await originalImageResponse(imagen)
    if (original) return original
  }

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#FFFFFF' }}>
        <div style={{ width: 470, height: '100%', display: 'flex', background: '#EEF2F7' }}>
          {imagen ? (
            <img src={imagen} alt="" width={470} height={630} style={{ width: 470, height: 630, objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #6D28D9 0%, #3B82F6 50%, #0D9488 100%)',
              }}
            >
              {/* Regalo en SVG local: los emoji obligan a satori a buscar la
                  fuente en un CDN externo (frágil y lento para el crawler). */}
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M12 8v13" />
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
              </svg>
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 60,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>{SITE_NAME}</span>
            <span
              style={{
                display: 'flex',
                background: '#EDE9FE',
                color: '#6D28D9',
                fontSize: 22,
                fontWeight: 700,
                padding: '6px 16px',
                borderRadius: 999,
              }}
            >
              Invitación
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 34, fontWeight: 600, color: '#6D28D9' }}>
              {referente} te invita
            </span>
            <span style={{ fontSize: 58, fontWeight: 800, color: '#0F172A', lineHeight: 1.05, marginTop: 10 }}>
              {beneficio.slice(0, 70)}
            </span>
            <span style={{ fontSize: 30, color: '#475569', marginTop: 18 }}>en {empresa}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              background: 'linear-gradient(90deg, #6D28D9, #0D9488)',
              color: 'white',
              fontSize: 30,
              fontWeight: 700,
              padding: '16px 34px',
              borderRadius: 999,
            }}
          >
            Aprovechar ahora →
          </div>
        </div>
      </div>
    ),
    size
  )
}
