import * as React from 'react'
import { cn } from '../cn'

/**
 * MMS · Shine — destello diagonal que barre una superficie.
 *
 * Envuelve contenido (tarjeta premium, cupón, CTA) y superpone el barrido de
 * luz. `modo="hover"` barre una vez al pasar el cursor; `modo="loop"` barre
 * en bucle lento para señalar un elemento "vivo" sin ser molesto. El brillo
 * es puramente decorativo (`aria-hidden`) y respeta reduce-motion vía CSS.
 *
 *   <Shine modo="loop"><Button variant="premium">Reclamar</Button></Shine>
 */
export function Shine({
  children,
  modo = 'hover',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  modo?: 'hover' | 'loop'
}) {
  return (
    <div
      data-slot="shine"
      className={cn('shine rounded-[inherit]', modo === 'hover' ? 'shine-hover' : 'shine-loop', className)}
      {...props}
    >
      {children}
      <span aria-hidden className="shine-sweep rounded-[inherit]" />
    </div>
  )
}
