import { cn } from '../cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  /** Acción recomendada (botón primario). */
  action?: React.ReactNode
  /** Acción alternativa (enlace o botón ghost). */
  secondaryAction?: React.ReactNode
  className?: string
}

/**
 * Empty state del sistema: ilustración suave (halo en anillos) + título +
 * descripción + acción recomendada. Nunca dejar un módulo en "No hay datos"
 * a secas: siempre proponer el siguiente paso.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className
      )}
    >
      {icon && (
        <div className="relative mb-5">
          {/* Halo decorativo en anillos concéntricos */}
          <div className="absolute left-1/2 top-1/2 -z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/50" />
          <div className="absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/30" />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-muted text-muted-foreground shadow-sm">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-h3 text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-small text-muted-foreground">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
