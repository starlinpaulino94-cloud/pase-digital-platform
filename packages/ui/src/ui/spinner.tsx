import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'

/**
 * MUK · Spinner / LoadingBlock — carga puntual.
 *
 * REGLA MDS: para cargar PANTALLAS se usa Skeleton (que calca el layout),
 * nunca un spinner. El spinner es solo para operaciones puntuales: dentro
 * de un botón, al recargar una sección pequeña, al buscar.
 */
const spinnerVariants = cva('animate-spin text-muted-foreground', {
  variants: {
    size: { sm: 'size-4', md: 'size-5', lg: 'size-8' },
  },
  defaultVariants: { size: 'md' },
})

function Spinner({
  className,
  size,
  label = 'Cargando',
}: VariantProps<typeof spinnerVariants> & { className?: string; label?: string }) {
  return (
    <Loader2 data-slot="spinner" role="status" aria-label={label} className={cn(spinnerVariants({ size }), className)} />
  )
}

/** Bloque centrado con texto — para paneles pequeños que recargan datos. */
function LoadingBlock({
  label = 'Cargando…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      data-slot="loading-block"
      aria-busy
      className={cn('flex items-center justify-center gap-2 py-10 text-muted-foreground', className)}
    >
      <Spinner size="sm" label={label} />
      <span className="text-small">{label}</span>
    </div>
  )
}

export { Spinner, LoadingBlock }
