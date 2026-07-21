'use client'

/**
 * Regalos P2P · Fase R2: tarjetas de regalos recibidos (aceptar/rechazar) y
 * enviados (cancelar mientras esté pendiente). Al aceptar, el receptor va a
 * la pantalla de celebración con su "Reclamar ahora".
 */

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Clock, Gift, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  responderRegalo,
  cancelarRegalo,
  type RegaloActionState,
} from '@/modules/regalos/actions'
import type { RegaloItem } from '@/modules/regalos/queries'

const initial: RegaloActionState = {}

export const ESTADO_REGALO: Record<string, { label: string; clase: string }> = {
  PENDIENTE: { label: 'Pendiente', clase: 'bg-warning/15 text-warning-foreground' },
  ACEPTADO: { label: 'Aceptado', clase: 'bg-success/15 text-success' },
  RECHAZADO: { label: 'Rechazado', clase: 'bg-destructive/10 text-destructive' },
  EXPIRADO: { label: 'Expirado', clase: 'bg-muted text-muted-foreground' },
  CANCELADO: { label: 'Cancelado', clase: 'bg-muted text-muted-foreground' },
}

function fmtFecha(d: Date) {
  return new Intl.DateTimeFormat('es-DO', {
    timeZone: 'America/Santo_Domingo',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(d))
}

function EstadoChip({ estado }: { estado: string }) {
  const e = ESTADO_REGALO[estado] ?? { label: estado, clase: 'bg-muted text-muted-foreground' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${e.clase}`}>
      {e.label}
    </span>
  )
}

function CabeceraRegalo({ r, prefijo }: { r: RegaloItem; prefijo: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
        <Gift className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        {r.usos} uso{r.usos !== 1 ? 's' : ''} de {r.beneficio}
        <EstadoChip estado={r.estado} />
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {prefijo} <strong>{r.contraparte}</strong> · {fmtFecha(r.createdAt)}
        {r.estado === 'PENDIENTE' && (
          <span className="ml-2 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> expira {fmtFecha(r.expiraAt)}
          </span>
        )}
      </p>
      {r.mensaje && (
        <p className="mt-2 rounded-xl bg-muted/60 p-2 text-xs italic text-foreground">
          “{r.mensaje}”
        </p>
      )}
    </div>
  )
}

export function RegaloRecibidoCard({ regalo }: { regalo: RegaloItem }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(responderRegalo, initial)
  const decisionRef = useRef<'aceptar' | 'rechazar'>('aceptar')

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success && state.detalle) {
      toast.success(state.detalle)
      if (decisionRef.current === 'aceptar') router.push('/cliente/celebracion')
    }
  }, [state, router])

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start gap-3">
        <CabeceraRegalo r={regalo} prefijo="De" />
        {regalo.estado === 'PENDIENTE' && (
          <form action={formAction} className="flex shrink-0 gap-2">
            <input type="hidden" name="regaloId" value={regalo.id} />
            <Button
              type="submit"
              name="decision"
              value="aceptar"
              size="sm"
              disabled={pending}
              onClick={() => (decisionRef.current = 'aceptar')}
              className="gap-1.5"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Aceptar
            </Button>
            <Button
              type="submit"
              name="decision"
              value="rechazar"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => (decisionRef.current = 'rechazar')}
              className="gap-1.5 text-destructive"
            >
              <X className="h-3.5 w-3.5" /> Rechazar
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export function RegaloEnviadoCard({ regalo }: { regalo: RegaloItem }) {
  const [state, formAction, pending] = useActionState(cancelarRegalo, initial)

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success && state.detalle) toast.success(state.detalle)
  }, [state])

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start gap-3">
        <CabeceraRegalo r={regalo} prefijo="Para" />
        {regalo.estado === 'PENDIENTE' && (
          <form action={formAction} className="shrink-0">
            <input type="hidden" name="regaloId" value={regalo.id} />
            <Button type="submit" size="sm" variant="ghost" disabled={pending} className="gap-1.5 text-muted-foreground">
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Cancelar
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
