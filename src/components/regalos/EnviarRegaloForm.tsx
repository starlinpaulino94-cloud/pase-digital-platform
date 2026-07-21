'use client'

/**
 * Regalos P2P · Fase R2: flujo de envío en 3 pasos dentro de un solo form.
 * 1) Destinatario: @ID exacto o búsqueda enmascarada con confirmación.
 * 2) Qué enviar: fuente (promoción de la wallet o lavados del plan) + usos.
 * 3) Dedicatoria opcional + confirmar.
 */

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Gift, Loader2, Search, User as UserIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  buscarDestinatario,
  enviarTransferencia,
  type RegaloActionState,
  type DestinatarioResultado,
} from '@/modules/regalos/actions'
import type { FuenteTransferencia } from '@/modules/regalos/queries'

const initial: RegaloActionState = {}

export function EnviarRegaloForm({ fuentes }: { fuentes: FuenteTransferencia[] }) {
  const router = useRouter()
  const [state, formAction, enviando] = useActionState(enviarTransferencia, initial)

  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<DestinatarioResultado[]>([])
  const [destinatario, setDestinatario] = useState<DestinatarioResultado | null>(null)
  const [buscando, startBusqueda] = useTransition()

  const [fuenteId, setFuenteId] = useState(fuentes[0]?.id ?? '')
  const fuente = fuentes.find((f) => f.id === fuenteId) ?? null
  const [usos, setUsos] = useState(1)

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success && state.detalle) {
      toast.success(state.detalle)
      router.push('/cliente/regalos')
    }
  }, [state, router])

  function buscar() {
    const q = query.trim()
    if (!q) return
    startBusqueda(async () => {
      const res = await buscarDestinatario(q)
      if (res.error) {
        toast.error(res.error)
        return
      }
      setResultados(res.resultados ?? [])
      if ((res.resultados ?? []).length === 0) toast.info('Sin resultados. Prueba con el @ID exacto.')
    })
  }

  const maxUsos = Math.min(fuente?.disponibles ?? 1, 20)

  return (
    <form action={formAction} className="space-y-6">
      {/* Paso 1 · Destinatario */}
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
        <h2 className="mb-1 text-sm font-semibold text-foreground">1 · ¿Para quién?</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Pega su <strong>@ID MembeGo</strong> (está en su perfil) o busca por nombre.
        </p>

        {destinatario ? (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
            {destinatario.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={destinatario.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <UserIcon className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{destinatario.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {destinatario.codigo ? `@${destinatario.codigo}` : ''}
                {destinatario.telefonoMask ? ` · ${destinatario.telefonoMask}` : ''}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setDestinatario(null)}>
              <X className="h-4 w-4" />
            </Button>
            <input type="hidden" name="destinatarioId" value={destinatario.clienteId} />
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="@ABC123 o nombre…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    buscar()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={buscar} disabled={buscando} className="gap-1.5">
                {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>
            {resultados.length > 0 && (
              <ul className="mt-3 divide-y divide-border/60 rounded-2xl border border-border/70">
                {resultados.map((r) => (
                  <li key={r.clienteId}>
                    <button
                      type="button"
                      onClick={() => {
                        setDestinatario(r)
                        setResultados([])
                      }}
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50"
                    >
                      {r.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <UserIcon className="h-4 w-4" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">{r.nombre}</span>
                        <span className="block text-xs text-muted-foreground">
                          {r.codigo ? `@${r.codigo}` : ''}
                          {r.telefonoMask ? ` · ${r.telefonoMask}` : ''}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-primary">¿Es esta persona?</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Paso 2 · Qué enviar */}
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-foreground">2 · ¿Qué le envías?</h2>
        <div className="space-y-2">
          {fuentes.map((f) => (
            <label
              key={f.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${fuenteId === f.id ? 'border-primary/50 bg-primary/5' : 'border-border/70 hover:bg-muted/40'}`}
            >
              <input
                type="radio"
                name="_fuente"
                checked={fuenteId === f.id}
                onChange={() => {
                  setFuenteId(f.id)
                  setUsos(1)
                }}
                className="accent-[var(--primary)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{f.titulo}</span>
                <span className="block text-xs text-muted-foreground">
                  {f.disponibles} disponible{f.disponibles !== 1 ? 's' : ''}
                  {f.origen === 'MEMBRESIA' ? ' · tu amigo necesita membresía activa' : ''}
                </span>
              </span>
            </label>
          ))}
        </div>
        {fuente && (
          <div className="mt-4 flex items-center gap-3">
            <Label htmlFor="usos" className="shrink-0">Cantidad</Label>
            <Input
              id="usos"
              type="number"
              min={1}
              max={maxUsos}
              value={usos}
              onChange={(e) => setUsos(Math.max(1, Math.min(maxUsos, Math.trunc(Number(e.target.value) || 1))))}
              className="w-24"
            />
            <span className="text-xs text-muted-foreground">de {fuente.disponibles}</span>
          </div>
        )}
        <input type="hidden" name="origen" value={fuente?.origen ?? ''} />
        <input type="hidden" name="origenId" value={fuente?.id ?? ''} />
        <input type="hidden" name="usos" value={usos} />
      </section>

      {/* Paso 3 · Dedicatoria + enviar */}
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-foreground">3 · Dedicatoria (opcional)</h2>
        <Textarea name="mensaje" rows={2} maxLength={200} placeholder="¡Disfrútalo! 🎁" />
        <Button
          type="submit"
          disabled={enviando || !destinatario || !fuente}
          className="mt-4 w-full gap-2 py-5 font-semibold"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
          Enviar regalo
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Los usos se reservan al enviar y vuelven a ti si tu amigo no acepta a tiempo.
        </p>
      </section>
    </form>
  )
}
