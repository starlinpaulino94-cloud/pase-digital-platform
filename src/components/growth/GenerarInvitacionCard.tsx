'use client'

import { useActionState, useEffect } from 'react'
import { Loader2, Link2, Check, Share2, MessageCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  generarGrowthLinkAction,
  type GenerarLinkState,
} from '@/modules/growth/actions'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

interface GenerarInvitacionCardProps {
  promos: { id: string; titulo: string }[]
  duraciones: { horas: number; label: string }[]
  duracionDefault: number
}

const init: GenerarLinkState = {}

/**
 * Growth Engine 3.0 · El cliente arma su invitación: elige el beneficio a
 * ofrecer y la duración, genera el enlace y lo comparte enriquecido (req #2/#6).
 */
export function GenerarInvitacionCard({
  promos,
  duraciones,
  duracionDefault,
}: GenerarInvitacionCardProps) {
  const [state, formAction, pending] = useActionState(generarGrowthLinkAction, init)
  const { copied, copy } = useCopyToClipboard()

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  async function copiar() {
    if (!state.url) return
    await copy(state.url, { successMessage: 'Enlace copiado.', errorMessage: 'No se pudo copiar.' })
  }

  async function compartir() {
    if (!state.url) return
    const text = '¡Te tengo una invitación exclusiva! Aprovéchala aquí:'
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Invitación', text, url: state.url })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
      return
    }
    copiar()
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </span>
        <div>
          <h3 className="font-semibold text-foreground">Crear invitación</h3>
          <p className="text-xs text-muted-foreground">
            Elige el beneficio y la duración; comparte un enlace irresistible.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        {promos.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Beneficio a ofrecer
            </label>
            <select
              name="promocionId"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="">Sin beneficio específico</option>
              {promos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Válido por
          </label>
          <select
            name="duracionHoras"
            defaultValue={duracionDefault}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {duraciones.map((d) => (
              <option key={d.horas} value={d.horas}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Generar enlace
        </button>
      </form>

      {state.ok && state.url && (
        <div className="mt-4 space-y-3 rounded-xl border border-success/25 bg-success/10 p-3">
          <p className="break-all font-mono text-xs text-foreground">{state.url}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copiar}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button
              onClick={compartir}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              <Share2 className="h-4 w-4" /> Compartir
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent('¡Te tengo una invitación exclusiva! ' + state.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
