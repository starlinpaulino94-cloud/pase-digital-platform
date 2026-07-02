'use client'

import * as Sentry from '@sentry/nextjs'
import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  error: Error | null
}

/**
 * Captura errores de render del subárbol del scanner (lado cliente) y muestra
 * el mensaje real en pantalla en vez de dejar que suban al error boundary de
 * ruta (que en producción oculta el mensaje). Así podemos diagnosticar en el
 * dispositivo del cajero sin acceso a logs.
 */
export class ScannerErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    try {
      Sentry.captureException(error, { tags: { boundary: 'scanner' } })
    } catch {}
    // eslint-disable-next-line no-console
    console.error('[scanner-boundary]', error)
  }

  handleReset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-700">Error en el escáner</h3>
            <p className="mt-2 break-words text-sm text-red-600">
              {error.message || 'Error desconocido'}
            </p>
          </div>
          {error.stack && (
            <pre className="max-h-40 overflow-auto rounded-lg bg-white p-3 text-left text-[10px] leading-tight text-slate-500">
              {error.stack}
            </pre>
          )}
          <Button onClick={this.handleReset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
