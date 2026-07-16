import * as React from 'react'
import { cn } from '../cn'

/**
 * MDS · GlassCard — superficie de cristal (glassmorphism).
 *
 * Usar SOLO sobre imágenes, gradientes o fondos hero: el blur necesita algo
 * detrás que difuminar. Sobre fondo plano usar `Card` normal (bg-card).
 * La utilidad `.glass-surface` (globals.css) aporta fondo, borde y blur
 * adaptados al tema. Ver docs/MDS.md § Tarjetas.
 */
function GlassCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="glass-card"
      className={cn('glass-surface rounded-2xl p-4 shadow-card', className)}
      {...props}
    />
  )
}

export { GlassCard }
