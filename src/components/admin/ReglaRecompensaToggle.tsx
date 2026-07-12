'use client'

import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import {
  actualizarReglaRecompensa,
  eliminarReglaRecompensa,
} from '@/modules/admin/recompensaActions'
import { Switch } from '@/components/ui/switch'
import { DeleteButton } from '@/components/ui/delete-button'
import { Loader2 } from 'lucide-react'

export function ReglaRecompensaToggle({ id, activo }: { id: string; activo: boolean }) {
  const [pending, startTransition] = useTransition()
  const [optimisticActivo, setOptimisticActivo] = useOptimistic(activo)

  function handleToggle(next: boolean) {
    startTransition(async () => {
      setOptimisticActivo(next)
      const fd = new FormData()
      fd.set('id', id)
      fd.set('activo', String(next))
      const res = await actualizarReglaRecompensa({}, fd)
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {pending && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
      )}
      <Switch
        checked={optimisticActivo}
        disabled={pending}
        onCheckedChange={handleToggle}
        aria-label={optimisticActivo ? 'Desactivar regla' : 'Activar regla'}
      />
      <DeleteButton
        action={async () => {
          const fd = new FormData()
          fd.set('id', id)
          return eliminarReglaRecompensa({}, fd)
        }}
        title="¿Eliminar esta regla?"
        label="Eliminar regla"
        successMessage="Regla eliminada."
      />
    </div>
  )
}
