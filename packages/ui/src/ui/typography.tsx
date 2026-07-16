import * as React from 'react'
import { cn } from '../cn'

/**
 * MUK · Typography — la escala MDS como componentes.
 *
 * Evita componer títulos con clases text-* y font-* a mano: `Heading` y `Text` emiten
 * las clases oficiales (.text-h1…, .text-body…) con la etiqueta semántica
 * correcta. `as` permite separar semántica de estilo (un h3 visual que es
 * h2 en el documento, etc.).
 */

type HeadingLevel = 1 | 2 | 3 | 4

function Heading({
  level = 1,
  as,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  /** Nivel VISUAL (escala .text-h1 … .text-h4). */
  level?: HeadingLevel
  /** Etiqueta semántica; por defecto coincide con el nivel visual. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div'
}) {
  const Tag = (as ?? (`h${level}` as const)) as React.ElementType
  return (
    <Tag
      data-slot="heading"
      className={cn(`text-h${level}`, 'text-foreground', className)}
      {...props}
    />
  )
}

/** Titular de héroe (landing / momentos wow). */
function Display({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 data-slot="display" className={cn('text-display text-foreground', className)} {...props} />
}

const TEXT_VARIANTS = {
  body: 'text-body text-foreground',
  small: 'text-small text-foreground',
  caption: 'text-caption',
  overline: 'text-overline',
  muted: 'text-body text-muted-foreground',
} as const

function Text({
  variant = 'body',
  as = 'p',
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  variant?: keyof typeof TEXT_VARIANTS
  as?: 'p' | 'span' | 'div' | 'label'
}) {
  const Tag = as as React.ElementType
  return <Tag data-slot="text" className={cn(TEXT_VARIANTS[variant], className)} {...props} />
}

export { Heading, Display, Text }
