'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { confirmarPago, rechazarPago, type AdminActionState } from '@/modules/admin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const init: AdminActionState = {}

export function ConfirmarPagoButton({ membershipId }: { membershipId: string }) {
  const [state, formAction, pending] = useActionState(confirmarPago, init)

  useEffect(() => {
    if (state.success) toast.success('Pago confirmado. Membresía activada.')
    if (state.error) toast.error(state.error)
  }, [state.success, state.error])

  return (
    <form action={formAction}>
      <input type="hidden" name="membershipId" value={membershipId} />
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="bg-green-600 hover:bg-green-500"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Aprobar
      </Button>
    </form>
  )
}

export function RechazarPagoButton({ membershipId }: { membershipId: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(rechazarPago, init)

  useEffect(() => {
    if (state.success) {
      toast.error('Pago rechazado.')
      setOpen(false)
    }
    if (state.error) toast.error(state.error)
  }, [state.success, state.error])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
          <X className="h-4 w-4" />
          Rechazar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar pago</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="membershipId" value={membershipId} />
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del rechazo *</Label>
            <Input
              id="motivo"
              name="motivo"
              placeholder="Ej: El monto no coincide con el plan seleccionado."
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rechazar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
