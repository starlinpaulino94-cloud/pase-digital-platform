'use client'

import { useTransition } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { cancelarInvitacion } from '@/modules/admin/invitacionActions'

export function CancelarInvitacionButton({ id }: { id: string }) {
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await cancelarInvitacion(id)
          if (res.error) toast.error(res.error)
          else toast.success('Invitación cancelada.')
        })
      }
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
      aria-label="Cancelar invitación"
    >
      <X className="h-3.5 w-3.5" /> Cancelar
    </button>
  )
}
