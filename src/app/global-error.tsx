'use client'

import { useEffect } from 'react'
/* eslint-disable @next/next/no-img-element */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    import('@sentry/nextjs')
      .then((Sentry) => Sentry.captureException(error))
      .catch(() => {})
  }, [error])

  return (
    <html lang="es">
      <body>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}>
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            <img src="/logo.svg" alt="MembreGo" width={36} height={36} />
            MembreGo
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Algo salió mal</h1>
          <p style={{ marginTop: '0.5rem', maxWidth: '28rem', color: '#94a3b8' }}>
            Ocurrió un error inesperado. Nuestro equipo ha sido notificado automáticamente.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 2rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  )
}
