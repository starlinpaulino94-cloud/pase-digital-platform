'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">
        No se pudo cargar esta sección
      </h1>
      <p className="mt-2 max-w-md text-slate-500">
        Ocurrió un error inesperado. Puedes reintentar sin salir del panel.
      </p>
      <Button onClick={() => reset()} className="mt-6">
        Reintentar
      </Button>
    </div>
  )
}
