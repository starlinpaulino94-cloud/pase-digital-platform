import { Skeleton } from '@/components/ui/skeleton'

/** Skeleton de Mis pagos: panel de suscripción → extracto de transacciones. */
export default function Loading() {
  return (
    <main className="container max-w-5xl py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />

      {/* Membresía actual */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border/60">
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="space-y-6 p-5">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-7 w-28" />
          </div>
          <div className="flex gap-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historial (extracto) */}
      <Skeleton className="mt-10 h-6 w-44" />
      <div className="mt-4 divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <Skeleton className="h-2 w-2 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </main>
  )
}
