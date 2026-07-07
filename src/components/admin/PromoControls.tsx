'use client'

import { useActionState, useEffect } from 'react'
import { Loader2, Pause, Play, Copy, Archive, ArchiveRestore } from 'lucide-react'
import { toast } from 'sonner'
import {
  alternarPausaPromocion,
  duplicarPromocion,
  alternarArchivoPromocion,
  type PromocionState,
} from '@/modules/admin/promocionActions'
import { Button } from '@/components/ui/button'

const init: PromocionState = {}

function ControlButton({
  id,
  action,
  icon,
  label,
  successMsg,
  confirmMsg,
}: {
  id: string
  action: typeof alternarPausaPromocion
  icon: React.ReactNode
  label: string
  successMsg: string
  confirmMsg?: string
}) {
  const [state, formAction, pending] = useActionState(action, init)

  useEffect(() => {
    if (state.success) toast.success(successMsg)
    if (state.error) toast.error(state.error)
  }, [state.success, state.error, successMsg])

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmMsg && !confirm(confirmMsg)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button size="icon" variant="ghost" type="submit" disabled={pending} title={label} aria-label={label}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </Button>
    </form>
  )
}

export function PromoControls({
  id,
  titulo,
  activo,
  archivada,
}: {
  id: string
  titulo: string
  activo: boolean
  archivada: boolean
}) {
  return (
    <div className="flex items-center">
      {!archivada && (
        <ControlButton
          id={id}
          action={alternarPausaPromocion}
          icon={
            activo ? (
              <Pause className="h-4 w-4 text-amber-500" />
            ) : (
              <Play className="h-4 w-4 text-green-600" />
            )
          }
          label={activo ? 'Pausar' : 'Reanudar'}
          successMsg={activo ? `"${titulo}" pausada.` : `"${titulo}" reanudada.`}
        />
      )}
      <ControlButton
        id={id}
        action={duplicarPromocion}
        icon={<Copy className="h-4 w-4 text-slate-500" />}
        label="Duplicar"
        successMsg={`Copia de "${titulo}" creada (pausada).`}
      />
      <ControlButton
        id={id}
        action={alternarArchivoPromocion}
        icon={
          archivada ? (
            <ArchiveRestore className="h-4 w-4 text-blue-500" />
          ) : (
            <Archive className="h-4 w-4 text-slate-500" />
          )
        }
        label={archivada ? 'Restaurar' : 'Archivar'}
        successMsg={archivada ? `"${titulo}" restaurada.` : `"${titulo}" archivada.`}
        confirmMsg={
          archivada ? undefined : `¿Archivar "${titulo}"? Saldrá de todos los listados.`
        }
      />
    </div>
  )
}
