'use client'

import { useActionState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarSucursal, type SucursalState } from '@/modules/admin/sucursalActions'
import { Button } from '@/components/ui/button'

const init: SucursalState = {}

export function DeleteSucursalButton({ id, nombre }: { id: string; nombre: string }) {
  const [state, formAction, pending] = useActionState(eliminarSucursal, init)

  useEffect(() => {
    if (state.success) toast.success(`"${nombre}" eliminada.`)
    if (state.error) toast.error(state.error)
  }, [state.success, state.error, nombre])

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar la sucursal "${nombre}"?`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button size="icon" variant="ghost" type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 text-red-500" />
        )}
      </Button>
    </form>
  )
}
