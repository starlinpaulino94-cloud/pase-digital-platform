import { Skeleton } from '@/components/ui/skeleton'

/** Skeleton del detalle: tarjeta wallet → QR → historial de visitas. */
export default function Loading() {
  return (
    <main className="container max-w-2xl py-8">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 aspect-[1.586/1] min-h-[196px] w-full rounded-[1.4rem]" />
      <div className="mt-8 flex flex-col items-center rounded-3xl border border-border/60 px-6 py-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-7 w-36 rounded-full" />
        <Skeleton className="mt-5 h-[272px] w-[272px] rounded-3xl" />
        <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
        </div>
      </div>
      <div className="mt-6 space-y-3 rounded-3xl border border-border/60 p-6">
        <Skeleton className="h-5 w-44" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </main>
  )
}
