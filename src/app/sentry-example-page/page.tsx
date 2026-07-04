'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'

export default function DebugSentryPage() {
  const [results, setResults] = useState<string[]>([])

  function log(msg: string) {
    setResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  function triggerClientError() {
    log('Triggering client error...')
    throw new Error('MembeGo Debug: Client-side test error')
  }

  function triggerSentryCapture() {
    log('Sending captureException to Sentry...')
    const eventId = Sentry.captureException(new Error('MembeGo Debug: Manual captureException test'))
    log(`Sent! Event ID: ${eventId}`)
  }

  function triggerSentryMessage() {
    log('Sending captureMessage to Sentry...')
    const eventId = Sentry.captureMessage('MembeGo Debug: Test message from sentry-example-page')
    log(`Sent! Event ID: ${eventId}`)
  }

  async function triggerServerError() {
    log('Calling /sentry-example-page/api ...')
    try {
      const res = await fetch('/sentry-example-page/api')
      const data = await res.json()
      log(`Server response: ${JSON.stringify(data)}`)
    } catch (e) {
      log(`Server error caught: ${e}`)
    }
  }

  async function triggerUnhandledRejection() {
    log('Triggering unhandled promise rejection...')
    Promise.reject(new Error('MembeGo Debug: Unhandled promise rejection test'))
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Sentry Debug Page
      </h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Usa estos botones para verificar que Sentry captura errores correctamente.
        Revisa tu dashboard en Sentry después de cada prueba.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button onClick={triggerSentryCapture} style={btnStyle}>
          1. captureException (manual)
        </button>
        <button onClick={triggerSentryMessage} style={btnStyle}>
          2. captureMessage (manual)
        </button>
        <button onClick={triggerClientError} style={{ ...btnStyle, backgroundColor: '#dc2626' }}>
          3. Client Error (throw)
        </button>
        <button onClick={triggerServerError} style={{ ...btnStyle, backgroundColor: '#7c3aed' }}>
          4. Server Error (API route)
        </button>
        <button onClick={triggerUnhandledRejection} style={{ ...btnStyle, backgroundColor: '#d97706' }}>
          5. Unhandled Promise Rejection
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Log:</p>
          {results.map((r, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r}</div>
          ))}
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#0ea5e9',
  color: 'white',
  border: 'none',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
}
