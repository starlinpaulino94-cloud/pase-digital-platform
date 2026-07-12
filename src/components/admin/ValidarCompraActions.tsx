'use client'

/**
 * Fase E5 · Botones de validación de compras de promociones (admin/pagos).
 * Mismo patrón que ValidarPagoActions de membresías.
 */

import { useActionState, useEffect, useState } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  aprobarCompra,
  rechazarCompra,
  type CompraAdminState,
} from '@/modules/admin/compraActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const init: CompraAdminState = {}

export function AprobarCompraButton({ compraId }: { compraId: string }) {
  const [state, formAction, pending] = useActionState(aprobarCompra, init)

  useEffect(() => {
    if (state.success) toast.success('Compra aprobada: la promoción quedó activa y el QR fue emitido.')
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction}>
      <input type="hidden" name="compraId" value={compraId} />
      <Button type="submit" variant="success" size="sm" disabled={pending} className="gap-1.5">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Aprobar y activar
      </Button>
    </form>
  )
}

export function RechazarCompraButton({ compraId }: { compraId: string }) {
  const [state, formAction, pending] = useActionState(rechazarCompra, init)
  const [manualOpen, setManualOpen] = useState(false)
  // El formulario se cierra solo al tener éxito (estado derivado), evitando
  // setState dentro del efecto.
  const open = manualOpen && !state.success

  useEffect(() => {
    if (state.success) toast.success('Compra rechazada. El cliente fue notificado.')
    if (state.error) toast.error(state.error)
  }, [state.success, state.error])

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setManualOpen(true)}>
        <XCircle className="h-3.5 w-3.5" />
        Rechazar
      </Button>
    )
  }

  return (
    <form action={formAction} className="flex w-full flex-wrap items-center gap-2">
      <input type="hidden" name="compraId" value={compraId} />
      <Input
        name="motivo"
        placeholder="Motivo del rechazo…"
        className="h-8 flex-1 text-sm"
        required
        autoFocus
      />
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
        Confirmar
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setManualOpen(false)}>
        Cancelar
      </Button>
    </form>
  )
}
