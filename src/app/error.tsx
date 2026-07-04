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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-4 py-12 text-center text-white">
      <div className="mb-8 flex items-center gap-2 text-2xl font-bold">
        <Image src="/logo.svg" alt="MembeGo" width={36} height={36} priority />
        MembeGo
      </div>
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-slate-400">
        Ocurrió un error inesperado. Puedes intentar recargar la página.
      </p>
      <Button
        onClick={() => reset()}
        className="mt-8 bg-sky-500 hover:bg-sky-400"
      >
        Recargar
      </Button>
    </div>
  )
}
