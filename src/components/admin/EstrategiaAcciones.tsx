'use client'

import { useActionState, useEffect } from 'react'
import { Loader2, Download, Play, Pause, Archive } from 'lucide-react'
import { toast } from 'sonner'
import {
  instalarEstrategia,
  publicarEstrategia,
  pausarEstrategia,
  archivarEstrategia,
  type EstrategiaState,
} from '@/modules/admin/estrategiasActions'
import { Button } from '@/components/ui/button'

const init: EstrategiaState = {}

/** Botón "Instalar" de un playbook de la biblioteca. */
export function InstalarEstrategiaButton({
  playbookId,
  nombre,
}: {
  playbookId: string
  nombre: string
}) {
  const [state, formAction, pending] = useActionState(instalarEstrategia, init)

  useEffect(() => {
    if (state.success) toast.success(`"${nombre}" instalada. Actívala cuando estés listo.`)
    if (state.error) toast.error(state.error)
  }, [state.success, state.error, nombre])

  return (
    <form action={formAction}>
      <input type="hidden" name="playbookId" value={playbookId} />
      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Instalar estrategia
      </Button>
    </form>
  )
}

/** Activar (publicar) una automatización instalada. */
export function PublicarEstrategiaButton({ id, nombre }: { id: string; nombre: string }) {
  const [state, formAction, pending] = useActionState(publicarEstrategia, init)

  useEffect(() => {
    if (state.success) toast.success(`"${nombre}" activada.`)
    if (state.error) toast.error(state.error)
  }, [state.success, state.error, nombre])

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="mr-1.5 h-3.5 w-3.5" />
        )}
        Activar
      </Button>
    </form>
  )
}

/** Pausar una automatización activa. */
export function PausarEstrategiaButton({ id, nombre }: { id: string; nombre: string }) {
  const [state, formAction, pending] = useActionState(pausarEstrategia, init)

  useEffect(() => {
    if (state.success) toast.success(`"${nombre}" pausada.`)
    if (state.error) toast.error(state.error)
  }, [state.success, state.error, nombre])

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Pause className="mr-1.5 h-3.5 w-3.5" />
        )}
        Pausar
      </Button>
    </form>
  )
}

/** Desinstalar (archivar): conserva el historial de ejecuciones. */
export function ArchivarEstrategiaButton({ id, nombre }: { id: string; nombre: string }) {
  const [state, formAction, pending] = useActionState(archivarEstrategia, init)

  useEffect(() => {
    if (state.success) toast.success(`"${nombre}" desinstalada.`)
    if (state.error) toast.error(state.error)
  }, [state.success, state.error, nombre])

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `¿Desinstalar "${nombre}"? Dejará de ejecutarse; el historial se conserva y puedes reinstalarla desde la biblioteca.`
          )
        )
          e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="ghost" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Archive className="mr-1.5 h-3.5 w-3.5 text-red-500" />
        )}
        Desinstalar
      </Button>
    </form>
  )
}
