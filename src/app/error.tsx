'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[oklch(0.14_0.035_260)] px-4 py-12 text-center text-white">
      <div className="mb-8 flex items-center gap-2 text-2xl font-bold">
        <Image src="/logo.svg" alt="MembeGo" width={36} height={36} priority />
        <span>
          Membe<span className="text-gradient">Go</span>
        </span>
      </div>
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-white/60">
        Ocurrió un error inesperado. Puedes intentar recargar la página.
      </p>
      <Button
        onClick={() => reset()}
        className="mt-8 bg-primary hover:bg-primary/90"
      >
        Recargar
      </Button>
    </div>
  )
}
