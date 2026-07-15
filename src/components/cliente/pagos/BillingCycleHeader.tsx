/**
 * Datos del ciclo de facturación SIN contenedores físicos (estilo Stripe
 * Billing): una fila fluida con divisores verticales ultra-delgados en
 * desktop, apilada con etiquetas tenues en móvil. Reemplaza a las sub-cajas
 * grises "cajas dentro de cajas".
 */
export function BillingCycleHeader({
  items,
}: {
  items: { label: string; value: string }[]
}) {
  const visibles = items.filter((i) => i.value && i.value !== '—')
  if (visibles.length === 0) return null

  return (
    <dl className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-border/60">
      {visibles.map((item, idx) => (
        <div
          key={item.label}
          className={idx === 0 ? 'sm:pr-6' : 'sm:px-6'}
        >
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
