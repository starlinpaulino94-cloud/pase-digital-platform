import { Skeleton } from '@/components/ui/skeleton'

/** Skeleton de las pantallas de acceso (layout oscuro centrado). */
export default function Loading() {
  return (
    <div className="w-full space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <Skeleton className="h-7 w-40 bg-white/10" />
      <Skeleton className="h-4 w-64 max-w-full bg-white/10" />
      <Skeleton className="h-10 w-full bg-white/10" />
      <Skeleton className="h-10 w-full bg-white/10" />
      <Skeleton className="h-11 w-full rounded-xl bg-white/10" />
    </div>
  )
}
