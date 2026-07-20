'use client'

import { useActionState, useEffect, useState } from 'react'
import { Check, Copy, Loader2, Pause, Play, Square, Ticket, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  cambiarEstadoOferta,
  gestionarInvitado,
  registrarUsoOferta,
  type OfertaActionState,
} from '@/modules/ofertas/actions'
import { Button } from '@/components/ui/button'

const init: OfertaActionState = {}

/** Copiar el link privado del regalo. */
export function CopiarLinkOferta({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-2 pl-3">
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{url}</code>
      <Button
        size="sm"
        variant={copiado ? 'outline' : 'default'}
        className="shrink-0 gap-1.5"
        onClick={async () => {
          await navigator.clipboard.writeText(url).catch(() => {})
          setCopiado(true)
          toast.success('Link copiado. Compártelo con tus clientes seleccionados.')
          setTimeout(() => setCopiado(false), 2000)
        }}
      >
        {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copiado ? 'Copiado' : 'Copiar link'}
      </Button>
    </div>
  )
}

/** Pausar / reactivar / finalizar la oferta. */
export function EstadoOfertaButtons({ ofertaId, estado }: { ofertaId: string; estado: string }) {
  const [state, formAction, pending] = useActionState(cambiarEstadoOferta, init)
  useEffect(() => {
    if (state.success) toast.success('Oferta actualizada.')
    if (state.error) toast.error(state.error)
  }, [state])

  if (estado === 'FINALIZADA') {
    return <p className="text-sm text-muted-foreground">Oferta finalizada.</p>
  }
  return (
    <form action={formAction} className="flex flex-wrap gap-2">
      <input type="hidden" name="ofertaId" value={ofertaId} />
      {estado === 'ACTIVA' ? (
        <Button type="submit" name="estado" value="PAUSADA" size="sm" variant="outline" disabled={pending} className="gap-1.5">
          <Pause className="h-3.5 w-3.5" /> Pausar
        </Button>
      ) : (
        <Button type="submit" name="estado" value="ACTIVA" size="sm" variant="outline" disabled={pending} className="gap-1.5">
          <Play className="h-3.5 w-3.5" /> Reactivar
        </Button>
      )}
      <Button
        type="submit"
        name="estado"
        value="FINALIZADA"
        size="sm"
        variant="ghost"
        disabled={pending}
        className="gap-1.5 text-muted-foreground hover:text-destructive"
      >
        <Square className="h-3.5 w-3.5" /> Finalizar
      </Button>
    </form>
  )
}

/** Registrar un canje del invitado (respeta el cupo del período). */
export function RegistrarUsoButton({
  invitadoId,
  disabled,
}: {
  invitadoId: string
  disabled?: boolean
}) {
  const [state, formAction, pending] = useActionState(registrarUsoOferta, init)
  useEffect(() => {
    if (state.success) toast.success(state.mensaje ?? 'Uso registrado.')
    if (state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="invitadoId" value={invitadoId} />
      <Button type="submit" size="sm" disabled={disabled || pending} className="gap-1.5">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ticket className="h-3.5 w-3.5" />}
        Registrar uso
      </Button>
    </form>
  )
}

/** Quitar a un invitado de la lista. */
export function QuitarInvitadoButton({ ofertaId, clienteId }: { ofertaId: string; clienteId: string }) {
  const [state, formAction, pending] = useActionState(gestionarInvitado, init)
  useEffect(() => {
    if (state.success) toast.success('Invitado quitado de la lista.')
    if (state.error) toast.error(state.error)
  }, [state])
  return (
    <form action={formAction}>
      <input type="hidden" name="ofertaId" value={ofertaId} />
      <input type="hidden" name="clienteId" value={clienteId} />
      <input type="hidden" name="accion" value="quitar" />
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        disabled={pending}
        className="gap-1.5 text-muted-foreground hover:text-destructive"
      >
        <UserMinus className="h-3.5 w-3.5" /> Quitar
      </Button>
    </form>
  )
}

/** Agregar un invitado (de los clientes que aún no están en la lista). */
export function AgregarInvitadoForm({
  ofertaId,
  candidatos,
}: {
  ofertaId: string
  candidatos: { id: string; nombre: string }[]
}) {
  const [state, formAction, pending] = useActionState(gestionarInvitado, init)
  useEffect(() => {
    if (state.success) toast.success('Invitado agregado y notificado.')
    if (state.error) toast.error(state.error)
  }, [state])

  if (candidatos.length === 0) return null
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="ofertaId" value={ofertaId} />
      <input type="hidden" name="accion" value="agregar" />
      <select
        name="clienteId"
        required
        defaultValue=""
        className="h-9 min-w-52 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="" disabled>
          Agregar cliente a la lista…
        </option>
        {candidatos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="gap-1.5">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
        Agregar
      </Button>
    </form>
  )
}
