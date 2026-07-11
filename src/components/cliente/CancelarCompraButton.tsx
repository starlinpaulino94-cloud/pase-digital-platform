'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cancelarCompraCliente } from '@/modules/promociones/compraActions'
import { Button } from '@/components/ui/button'

export function CancelarCompraButton({ compraId }: { compraId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [pending, start] = useTransition()

  function cancelar() {
    start(async () => {
      const res = await cancelarCompraCliente(compraId)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Compra cancelada.')
        router.refresh()
      }
    })
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirming(true)}>
        Cancelar esta compra
      </Button>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm" onClick={cancelar} disabled={pending} className="gap-1.5">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
        Sí, cancelar
      </Button>
      <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
        No, volver
      </Button>
    </div>
  )
}
