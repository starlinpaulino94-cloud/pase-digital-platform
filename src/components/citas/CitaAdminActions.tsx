'use client'

import { useActionState, useEffect, useState } from 'react'
import { Check, CheckCheck, Loader2, UserX, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarEstadoCita, type CitaActionState } from '@/modules/citas/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const init: CitaActionState = {}

/** Acción directa (sin motivo): confirmar / completar / no asistió. */
function AccionDirecta({
  citaId,
  accion,
  label,
  icon: Icon,
  variant = 'outline',
}: {
  citaId: string
  accion: 'confirmar' | 'completar' | 'no_asistio'
  label: string
  icon: typeof Check
  variant?: 'outline' | 'default'
}) {
  const [state, formAction, pending] = useActionState(actualizarEstadoCita, init)
  useEffect(() => {
    if (state.success) toast.success(`Cita actualizada.`)
    if (state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="citaId" value={citaId} />
      <input type="hidden" name="accion" value={accion} />
      <Button type="submit" size="sm" variant={variant} disabled={pending} className="gap-1.5">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
        {label}
      </Button>
    </form>
  )
}

/** Cancelación por el NEGOCIO: exige motivo (se le envía al cliente). */
function CancelarConMotivo({ citaId, clienteNombre }: { citaId: string; clienteNombre: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(actualizarEstadoCita, init)
  useEffect(() => {
    if (state.success) {
      toast.success('Cita cancelada. El cliente fue notificado.')
      const t = setTimeout(() => setOpen(false), 0)
      return () => clearTimeout(t)
    }
    if (state.error) toast.error(state.error)
  }, [state])
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="gap-1.5 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <XCircle className="h-3.5 w-3.5" /> Cancelar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar la cita de {clienteNombre}</DialogTitle>
            <DialogDescription>
              El motivo se le enviará al cliente en la notificación.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="citaId" value={citaId} />
            <input type="hidden" name="accion" value="cancelar" />
            <textarea
              name="motivo"
              rows={2}
              required
              maxLength={300}
              placeholder="Motivo de la cancelación…"
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Volver
              </Button>
              <Button type="submit" variant="destructive" disabled={pending} className="flex-1 gap-2">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Cancelar cita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Barra de acciones del panel según el estado actual de la cita. */
export function CitaAdminActions({
  citaId,
  estado,
  clienteNombre,
}: {
  citaId: string
  estado: string
  clienteNombre: string
}) {
  const activa = estado === 'PENDIENTE' || estado === 'CONFIRMADA'
  if (!activa) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {estado === 'PENDIENTE' && (
        <AccionDirecta citaId={citaId} accion="confirmar" label="Confirmar" icon={Check} variant="default" />
      )}
      <AccionDirecta citaId={citaId} accion="completar" label="Completada" icon={CheckCheck} />
      <AccionDirecta citaId={citaId} accion="no_asistio" label="No asistió" icon={UserX} />
      <CancelarConMotivo citaId={citaId} clienteNombre={clienteNombre} />
    </div>
  )
}
