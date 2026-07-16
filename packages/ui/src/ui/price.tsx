import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'

/**
 * MUK · Price — el ÚNICO formato de dinero de la plataforma.
 *
 * RD$ + es-DO + tabular-nums, con precio tachado opcional (oferta) y modo
 * "Gratis". Reemplaza a los fmtRD sueltos repetidos por módulo.
 *
 *   <Price value={1500} />                        → RD$1,500.00
 *   <Price value={990} original={1500} size="lg"/> → RD$990.00  ~RD$1,500.00~
 *   <Price value={0} gratisSiCero />               → Gratis
 */
const priceVariants = cva('font-semibold tabular-nums text-foreground', {
  variants: {
    size: {
      sm: 'text-small',
      md: 'text-[15px]',
      lg: 'text-lg',
      xl: 'text-2xl font-bold',
    },
  },
  defaultVariants: { size: 'md' },
})

export function formatearRD(n: number): string {
  return `RD$${n.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
}

function Price({
  value,
  original,
  gratisSiCero = false,
  className,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof priceVariants> & {
    value: number
    /** Precio anterior (se muestra tachado al lado). */
    original?: number
    /** Si value === 0, muestra "Gratis" en verde de marca. */
    gratisSiCero?: boolean
  }) {
  if (gratisSiCero && value === 0) {
    return (
      <span
        data-slot="price"
        className={cn(priceVariants({ size }), 'text-success', className)}
        {...props}
      >
        Gratis
      </span>
    )
  }
  return (
    <span data-slot="price" className={cn('inline-flex items-baseline gap-1.5', className)} {...props}>
      <span className={priceVariants({ size })}>{formatearRD(value)}</span>
      {original != null && original > value && (
        <s className="text-caption font-normal text-muted-foreground">{formatearRD(original)}</s>
      )}
    </span>
  )
}

export { Price }
