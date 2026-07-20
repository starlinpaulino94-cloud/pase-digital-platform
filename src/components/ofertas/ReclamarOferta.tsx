'use client'

import { useActionState, useEffect } from 'react'
import { Gift, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { reclamarOferta, type OfertaActionState } from '@/modules/ofertas/actions'
import { Button } from '@/components/ui/button'

const init: OfertaActionState = {}

export function ReclamarOferta({ codigo }: { codigo: string }) {
  const [state, formAction, pending] = useActionState(reclamarOferta, init)

  useEffect(() => {
    if (state.success) toast.success(state.mensaje ?? '¡Regalo reclamado!')
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction}>
      <input type="hidden" name="codigo" value={codigo} />
      <Button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full gap-2 bg-foreground font-bold text-background shadow-md hover:bg-foreground hover:opacity-95"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
        Reclamar mi regalo
      </Button>
    </form>
  )
}
