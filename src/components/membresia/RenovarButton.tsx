'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { seleccionarPlan, type SeleccionState } from '@/modules/membresia/actions'
import { Button } from '@/components/ui/button'

const init: SeleccionState = {}

export function RenovarButton({ planId, planNombre }: { planId: string; planNombre: string }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(seleccionarPlan, init)

  useEffect(() => {
    if (state.success) {
      toast.success('Solicitud de renovación enviada. Sube tu comprobante para activarla.')
      router.refresh()
    }
    if (state.error) toast.error(state.error)
  }, [state.success, state.error, router])

  return (
    <form action={formAction}>
      <input type="hidden" name="planId" value={planId} />
      <Button type="submit" disabled={pending} className="bg-sky-500 hover:bg-sky-400 gap-2">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Renovar — {planNombre}
      </Button>
    </form>
  )
}
