'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function EmpresaError({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-bold text-slate-900">Algo salió mal</h2>
      <p className="text-sm text-slate-500">No pudimos cargar esta página. Intenta de nuevo.</p>
      <div className="flex gap-3">
        <Button onClick={() => reset()} variant="outline">Reintentar</Button>
        <Link href="/login"><Button>Ir al login</Button></Link>
      </div>
    </div>
  )
}
