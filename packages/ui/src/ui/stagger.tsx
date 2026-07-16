'use client'

import { Children, isValidElement, type ReactNode } from 'react'
import { Reveal, type RevealAnim } from './reveal'
import { cn } from '../cn'

/**
 * MMS · Stagger — cascada: los hijos entran uno tras otro al hacer scroll.
 *
 * Envuelve cada hijo directo en un `Reveal` con un retraso incremental. Base
 * del "Card Cascade" del home y de cualquier grid/lista que deba sentirse
 * viva. Con reduce-motion todos aparecen a la vez (los Reveal se neutralizan).
 *
 *   <Stagger anim="fade-up" step={80} className="grid gap-4">
 *     {items.map((it) => <Card key={it.id}>…</Card>)}
 *   </Stagger>
 */
export function Stagger({
  children,
  className,
  anim = 'fade-up',
  step = 70,
  initialDelay = 0,
  maxDelay = 600,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  anim?: RevealAnim
  /** Retraso añadido por cada hijo (ms). */
  step?: number
  /** Retraso del primer hijo (ms). */
  initialDelay?: number
  /** Tope de retraso: evita esperas largas en listas grandes. */
  maxDelay?: number
  as?: 'div' | 'ul' | 'ol' | 'section'
}) {
  const items = Children.toArray(children).filter(isValidElement)
  return (
    <Tag className={cn(className)}>
      {items.map((child, i) => (
        <Reveal key={i} anim={anim} delay={Math.min(initialDelay + i * step, maxDelay)}>
          {child}
        </Reveal>
      ))}
    </Tag>
  )
}
