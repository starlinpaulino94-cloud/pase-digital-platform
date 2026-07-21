'use client'

/**
 * Regalos P2P · Fase R4 — cancelación de un regalo PENDIENTE desde el panel
 * admin (soporte/anti-abuso). Pide motivo obligatorio; al confirmar devuelve
 * los usos reservados al remitente y avisa a ambas partes.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { cancelarRegaloAdmin } from '@/modules/regalos/actions'

export function CancelarRegaloAdminButton({
  regaloId,
  descripcion,
}: {
  regaloId: string
  descripcion: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [pending, startTransition] = useTransition()

  function confirmar() {
    startTransition(async () => {
      const res = await cancelarRegaloAdmin(regaloId, motivo)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Regalo cancelado. Los usos volvieron al remitente.')
      setOpen(false)
      setMotivo('')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
          <Ban className="h-3.5 w-3.5" /> Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar regalo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Se cancelará <strong>{descripcion}</strong>: los usos reservados vuelven al
            remitente y ambas partes reciben una notificación con el motivo. Si es un
            regalo pagado con orden pendiente, gestiona también esa orden desde Pagos.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="motivo-cancelacion-regalo">Motivo</Label>
            <Textarea
              id="motivo-cancelacion-regalo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Ej. Solicitud del cliente, uso indebido, error…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={confirmar}
            disabled={pending || motivo.trim().length < 3}
            className="gap-2"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Cancelar regalo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
