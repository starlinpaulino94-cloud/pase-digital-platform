'use client'

/**
 * Anular (contablemente) una transacción aplicada (Control de comprobantes ·
 * Fase 4). Pide un motivo obligatorio; al confirmar, la transacción pasa a
 * CANCELLED y deja de sumar en cierres y reportes. Solo se ofrece para
 * transacciones aplicadas.
 */

import { useState, useTransition } from 'react'
import { Ban, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { anularTransaccion } from '@/modules/transacciones/actions'

export function AnularTransaccionButton({
  transactionId,
  referencia,
}: {
  transactionId: string
  referencia: string
}) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [pending, startTransition] = useTransition()

  function confirmar() {
    startTransition(async () => {
      const res = await anularTransaccion(transactionId, motivo)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Transacción anulada.')
      setOpen(false)
      setMotivo('')
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
          <Ban className="h-3.5 w-3.5" /> Anular
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Anular {referencia}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            La transacción quedará <strong>anulada</strong> y dejará de sumar en cierres y
            reportes. No se elimina: queda registrada con su motivo. Esto no revierte
            automáticamente efectos como la activación de una membresía.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="motivo-anulacion">Motivo</Label>
            <Textarea
              id="motivo-anulacion"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Ej. Cobro duplicado, error de monto, devolución al cliente…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={pending || motivo.trim().length < 3} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Anular transacción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
