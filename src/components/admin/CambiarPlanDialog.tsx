'use client'

import { useActionState, useEffect, useState } from 'react'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cambiarPlanDeMembresia } from '@/modules/admin/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export interface PlanOption {
  id: string
  nombre: string
  precioLabel: string
}

interface State {
  error?: string
  success?: boolean
}

/**
 * Cambio de plan por el ADMINISTRADOR (política: el cliente no puede cambiar
 * su plan desde la app). Selecciona el nuevo plan y lo aplica de inmediato:
 * reinicia período y usos, audita y notifica al cliente.
 */
export function CambiarPlanDialog({
  membershipId,
  clienteNombre,
  planActualId,
  planActualNombre,
  planes,
}: {
  membershipId: string
  clienteNombre: string
  planActualId: string
  planActualNombre: string
  planes: PlanOption[]
}) {
  const [open, setOpen] = useState(false)
  const init: State = {}
  const [state, formAction, pending] = useActionState(cambiarPlanDeMembresia, init)
  const opciones = planes.filter((p) => p.id !== planActualId)

  useEffect(() => {
    if (state.success) {
      toast.success('Plan actualizado. El cliente fue notificado.')
      // Cerrar fuera del cuerpo del efecto (regla set-state-in-effect).
      const t = setTimeout(() => setOpen(false), 0)
      return () => clearTimeout(t)
    }
    if (state.error) toast.error(state.error)
  }, [state])

  if (opciones.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Cambiar plan"
          aria-label={`Cambiar plan de ${clienteNombre}`}
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar plan de {clienteNombre}</DialogTitle>
          <DialogDescription>
            Plan actual: <span className="font-semibold text-foreground">{planActualNombre}</span>.
            El nuevo plan se aplica de inmediato: reinicia el período y los usos,
            y el cliente recibe una notificación.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="membershipId" value={membershipId} />
          <label className="block text-sm font-medium text-foreground">
            Nuevo plan
            <select
              name="planId"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Selecciona un plan…
              </option>
              {opciones.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {p.precioLabel}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={pending} className="w-full gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            Aplicar cambio de plan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
