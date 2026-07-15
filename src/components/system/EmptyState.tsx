import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Estado vacío ilustrado ÚNICO de la app: icono grande sobre gradiente con
 * halos de luz, título corto, descripción de una línea y CTA destacado.
 * Reemplaza a los bloques grises "No hay datos" repartidos por el sistema.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-border/70 bg-card p-10 text-center shadow-card',
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-info/10 blur-3xl" />
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-5">
        <span className="animate-float flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-primary/15 to-info/15 ring-1 ring-inset ring-primary/10">
          <Icon className="h-9 w-9 text-primary" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex flex-col gap-2 sm:flex-row">{action}</div>}
      </div>
    </div>
  )
}
