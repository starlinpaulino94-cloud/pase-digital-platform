'use client'

import { useActionState, useState } from 'react'
import { Loader2, Check, X } from 'lucide-react'
import { aprobarPago, rechazarPago, type AprobarState } from '@/modules/pagos/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const initial: AprobarState = {}

export function PagoAdminActions({
  paymentId,
}: {
  paymentId: string
  metodo: string
}) {
  const [aprobarState, aprobarAction, aprobarPending] = useActionState(aprobarPago, initial)
  const [rechazarState, rechazarAction, rechazarPending] = useActionState(rechazarPago, initial)
  const [rechazarOpen, setRechazarOpen] = useState(false)

  // Manejar resultados
  if (aprobarState.success) {
    toast.success('Pago aprobado. Membresía activada y QR generado.')
  }
  if (rechazarState.success) {
    toast.success('Pago rechazado. Cliente notificado.')
  }

  return (
    <div className="flex gap-2">
      <form action={aprobarAction}>
        <input type="hidden" name="paymentId" value={paymentId} />
        <Button
          type="submit"
          size="sm"
          disabled={aprobarPending}
          className="bg-green-600 hover:bg-green-500"
        >
          {aprobarPending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Check className="mr-1 h-3 w-3" />
          )}
          Aprobar
        </Button>
      </form>

      <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
        <form action={rechazarAction}>
          <input type="hidden" name="paymentId" value={paymentId} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => setRechazarOpen(true)}
          >
            <X className="mr-1 h-3 w-3" />
            Rechazar
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rechazar pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {rechazarState.error && (
                <p className="text-sm text-red-600">{rechazarState.error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="motivoRechazo">Motivo del rechazo *</Label>
                <Textarea
                  id="motivoRechazo"
                  name="motivoRechazo"
                  rows={3}
                  placeholder="Ej: Comprobante ilegible, monto incorrecto..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRechazarOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={rechazarPending}
                className="bg-red-600 hover:bg-red-500"
              >
                {rechazarPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar rechazo
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </div>
  )
}
