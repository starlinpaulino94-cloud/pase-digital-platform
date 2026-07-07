'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { confirmarPago, renovarMembresia } from '@/modules/admin/actions'
import { cancelarMembresia, desactivarMembresia } from '@/modules/admin/planActions'
import { Button } from '@/components/ui/button'
import { ConfirmarPagoButton, RechazarPagoButton } from '@/components/admin/ValidarPagoActions'
import type { MembershipEstado } from '@/types'

interface Props {
  membershipId: string
  estado: MembershipEstado
  clienteId: string
  planPrecio: number
  planLavados: number
  planEsIlimitado: boolean
}

export function MembershipAdminActions({
  membershipId,
  estado,
  planPrecio,
}: Props) {
  const [activarState, activarAction, activarPending] = useActionState(confirmarPago, {})
  const [cancelarState, cancelarAction, cancelarPending] = useActionState(cancelarMembresia, {})
  const [desactivarState, desactivarAction, desactivarPending] = useActionState(desactivarMembresia, {})
  const [renovarState, renovarAction, renovarPending] = useActionState(renovarMembresia, {})
  const router = useRouter()

  useEffect(() => {
    if (activarState.success || cancelarState.success || desactivarState.success || renovarState.success) {
      router.refresh()
    }
  }, [activarState.success, cancelarState.success, desactivarState.success, renovarState.success, router])

  const error = activarState.error ?? cancelarState.error ?? desactivarState.error ?? renovarState.error

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}

      {/* Activar pago — for PENDIENTE */}
      {estado === 'PENDIENTE' && (
        <form action={activarAction}>
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="monto" value={planPrecio} />
          <Button
            size="sm"
            type="submit"
            disabled={activarPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {activarPending ? '…' : 'Activar'}
          </Button>
        </form>
      )}

      {/* Validar comprobante — for PENDIENTE_PAGO */}
      {estado === 'PENDIENTE_PAGO' && (
        <>
          <ConfirmarPagoButton membershipId={membershipId} />
          <RechazarPagoButton membershipId={membershipId} />
        </>
      )}

      {/* Renovar — for ACTIVA or VENCIDA */}
      {(estado === 'ACTIVA' || estado === 'VENCIDA') && (
        <form action={renovarAction}>
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="monto" value={planPrecio} />
          <Button
            size="sm"
            variant="outline"
            type="submit"
            disabled={renovarPending}
          >
            {renovarPending ? '…' : 'Renovar'}
          </Button>
        </form>
      )}

      {/* Desactivar — for ACTIVA */}
      {estado === 'ACTIVA' && (
        <form action={desactivarAction}>
          <input type="hidden" name="membershipId" value={membershipId} />
          <Button
            size="sm"
            variant="outline"
            type="submit"
            disabled={desactivarPending}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            onClick={(e) => {
              if (!confirm('¿Desactivar esta membresía?')) e.preventDefault()
            }}
          >
            {desactivarPending ? '…' : 'Desactivar'}
          </Button>
        </form>
      )}

      {/* Cancelar — for anything except CANCELADA */}
      {estado !== 'CANCELADA' && (
        <form action={cancelarAction}>
          <input type="hidden" name="membershipId" value={membershipId} />
          <Button
            size="sm"
            variant="outline"
            type="submit"
            disabled={cancelarPending}
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={(e) => {
              if (!confirm('¿Cancelar esta membresía? No se puede deshacer.')) e.preventDefault()
            }}
          >
            {cancelarPending ? '…' : 'Cancelar'}
          </Button>
        </form>
      )}
    </div>
  )
}
