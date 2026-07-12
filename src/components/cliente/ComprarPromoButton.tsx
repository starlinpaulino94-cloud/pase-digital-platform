'use client'

/**
 * Fase E5 · CTA de compra de una promoción (panel del cliente).
 * Solicita la compra y lleva al detalle de "Mis promociones" para pagar por
 * transferencia y subir el comprobante (o directo al QR si es gratis).
 */

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShoppingBag, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { solicitarCompraPromocion, type CompraState } from '@/modules/promociones/compraActions'
import { Button } from '@/components/ui/button'

const init: CompraState = {}

function fmtRD(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(n)
}

export function ComprarPromoButton({
  promocionId,
  precio,
  agotada,
}: {
  promocionId: string
  precio: number
  agotada: boolean
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(solicitarCompraPromocion, init)
  const esGratis = precio <= 0

  useEffect(() => {
    if (state.success && state.compraId) {
      toast.success(
        state.activada
          ? '¡Promoción activada! Tu QR está listo.'
          : 'Solicitud creada. Completa el pago para activarla.'
      )
      router.push(`/cliente/mis-promociones/${state.compraId}`)
    } else if (state.error) {
      toast.error(state.error)
      // Ya tiene una compra viva de esta promo: llevarlo a esa compra.
      if (state.compraId) router.push(`/cliente/mis-promociones/${state.compraId}`)
    }
  }, [state, router])

  if (agotada) {
    return (
      <Button size="xl" className="w-full font-bold" disabled>
        Promoción agotada
      </Button>
    )
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="promocionId" value={promocionId} />
      <Button type="submit" size="xl" className="w-full gap-2 font-bold shadow-glow" disabled={pending}>
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : esGratis ? (
          <Sparkles className="h-5 w-5" />
        ) : (
          <ShoppingBag className="h-5 w-5" />
        )}
        {esGratis ? 'Obtener gratis' : `Adquirir por ${fmtRD(precio)}`}
      </Button>
    </form>
  )
}
