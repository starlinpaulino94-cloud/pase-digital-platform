import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'

/**
 * MUK · AppIcon — wrapper único de iconografía.
 *
 * Todos los iconos de la plataforma pasan por aquí: garantiza tamaños de la
 * escala MDS, tonos por token y accesibilidad (decorativo = aria-hidden;
 * con `label` = role img). El set permitido es Lucide (line); si algún día
 * cambia la librería, solo cambia este archivo.
 *
 *   <AppIcon icon={Gift} size="md" tone="primary" />
 *   <AppIcon icon={Bell} label="Notificaciones" />
 */
const appIconVariants = cva('shrink-0', {
  variants: {
    size: {
      xs: 'size-3',    // dentro de badges
      sm: 'size-4',    // botones, inputs
      md: 'size-5',    // navegación, listas
      lg: 'size-6',    // standalone, cabeceras
      xl: 'size-7',    // EmptyState, héroes
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-destructive',
      info: 'text-info',
      inherit: '', // hereda el color del padre (botones, badges)
    },
  },
  defaultVariants: { size: 'sm', tone: 'inherit' },
})

function AppIcon({
  icon: Icon,
  label,
  className,
  size,
  tone,
  ...props
}: Omit<React.ComponentProps<LucideIcon>, 'size'> &
  VariantProps<typeof appIconVariants> & {
    icon: LucideIcon
    /** Texto para lectores de pantalla. Sin él, el icono es decorativo. */
    label?: string
  }) {
  return (
    <Icon
      data-slot="app-icon"
      className={cn(appIconVariants({ size, tone }), className)}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      {...props}
    />
  )
}

export { AppIcon, appIconVariants }
