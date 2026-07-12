'use client'

import { useActionState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarVehiculo, type ProfileState } from '@/modules/cliente/profileActions'
import { Button } from '@/components/ui/button'

const init: ProfileState = {}

export function DeleteVehiculoButton({ vehiculoId, label }: { vehiculoId: string; label: string }) {
  const [state, formAction, pending] = useActionState(eliminarVehiculo, init)

  useEffect(() => {
    if (state.success) toast.success('Vehículo eliminado.')
    if (state.error) toast.error(state.error)
  }, [state.success, state.error])

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar "${label}"?`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="vehiculoId" value={vehiculoId} />
      <Button size="icon" variant="ghost" type="submit" disabled={pending} aria-label="Eliminar vehículo" title="Eliminar vehículo">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 text-destructive" />
        )}
      </Button>
    </form>
  )
}
