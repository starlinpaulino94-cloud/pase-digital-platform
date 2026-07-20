'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cancelarCitaCliente, type CitaActionState } from '@/modules/citas/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const init: CitaActionState = {}

/** Cancelación de la cita por el CLIENTE, con confirmación previa. */
export function CancelarCitaButton({ citaId }: { citaId: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(cancelarCitaCliente, init)

  useEffect(() => {
    if (state.success) {
      toast.success(state.mensaje ?? 'Cita cancelada.')
      const t = setTimeout(() => setOpen(false), 0)
      return () => clearTimeout(t)
    }
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive">
          <XCircle className="h-4 w-4" /> Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Cancelar esta cita?</DialogTitle>
          <DialogDescription>
            El turno quedará libre para otra persona. Podrás reservar otro
            cuando quieras.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex gap-2">
          <input type="hidden" name="citaId" value={citaId} />
          <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Mantener
          </Button>
          <Button type="submit" variant="destructive" disabled={pending} className="flex-1 gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Cancelar cita
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
