'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  crearPromocion,
  actualizarPromocion,
  type PromocionState,
} from '@/modules/admin/promocionActions'
import {
  PROMO_TIPOS,
  PROMO_VISIBILIDADES,
  TIPOS_CON_PORCENTAJE,
  TIPOS_CON_MONTO,
} from '@/lib/promociones'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Existing {
  id: string
  titulo: string
  descripcion: string
  imagenUrl: string | null
  tipo: string
  descuento: number | null
  codigo: string | null
  visibilidad: string
  vigenciaDesde: Date
  vigenciaHasta: Date | null
  maxCanjes: number | null
  prioridad: number
  activo: boolean
}

const init: PromocionState = {}

function toDatetimeLocal(d: Date | null) {
  if (!d) return ''
  const date = new Date(d)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function PromocionForm({ existing }: { existing?: Existing }) {
  const router = useRouter()
  const action = existing ? actualizarPromocion : crearPromocion
  const [state, formAction, pending] = useActionState(action, init)
  const [tipo, setTipo] = useState(existing?.tipo ?? 'descuento')

  useEffect(() => {
    if (state.success) {
      toast.success(
        existing
          ? 'Promoción actualizada.'
          : 'Promoción publicada. Tus seguidores fueron notificados.'
      )
      router.push('/admin/promociones')
      router.refresh()
    }
  }, [state.success, existing, router])

  const pidePorcentaje = TIPOS_CON_PORCENTAJE.includes(tipo)
  const pideMonto = TIPOS_CON_MONTO.includes(tipo)

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {existing && <input type="hidden" name="id" value={existing.id} />}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Qué ofreces */}
      <div className="space-y-5 rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900">Qué ofreces</h3>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de promoción *</Label>
            <Select name="tipo" value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMO_TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(pidePorcentaje || pideMonto) && (
            <div className="space-y-2">
              <Label htmlFor="descuento">
                {pidePorcentaje ? 'Descuento (%)' : 'Monto de descuento (RD$)'}
              </Label>
              <Input
                id="descuento"
                name="descuento"
                type="number"
                min={0}
                max={pidePorcentaje ? 100 : undefined}
                defaultValue={existing?.descuento ?? ''}
                placeholder={pidePorcentaje ? '25' : '500'}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            name="titulo"
            defaultValue={existing?.titulo}
            placeholder="Ej: 25% de descuento en tu primer mes"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción *</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            defaultValue={existing?.descripcion}
            rows={4}
            placeholder="Condiciones y detalles para el cliente"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código promocional / cupón</Label>
            <Input
              id="codigo"
              name="codigo"
              defaultValue={existing?.codigo ?? ''}
              placeholder="Ej: BIENVENIDA25"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imagenUrl">Imagen (URL)</Label>
            <Input
              id="imagenUrl"
              name="imagenUrl"
              defaultValue={existing?.imagenUrl ?? ''}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Vigencia y límites */}
      <div className="space-y-5 rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900">Vigencia y límites</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vigenciaDesde">Inicio (fecha y hora)</Label>
            <Input
              id="vigenciaDesde"
              name="vigenciaDesde"
              type="datetime-local"
              defaultValue={toDatetimeLocal(existing?.vigenciaDesde ?? new Date())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vigenciaHasta">Fin (fecha y hora)</Label>
            <Input
              id="vigenciaHasta"
              name="vigenciaHasta"
              type="datetime-local"
              defaultValue={toDatetimeLocal(existing?.vigenciaHasta ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Vacío = sin fecha de expiración.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxCanjes">Límite de canjes (stock)</Label>
            <Input
              id="maxCanjes"
              name="maxCanjes"
              type="number"
              min={1}
              defaultValue={existing?.maxCanjes ?? ''}
              placeholder="Vacío = ilimitado"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prioridad">Prioridad</Label>
            <Input
              id="prioridad"
              name="prioridad"
              type="number"
              defaultValue={existing?.prioridad ?? 0}
            />
            <p className="text-xs text-muted-foreground">
              Mayor número = aparece primero.
            </p>
          </div>
        </div>
      </div>

      {/* Alcance */}
      <div className="space-y-5 rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900">Alcance</h3>
        <div className="space-y-2">
          <Label htmlFor="visibilidad">Visibilidad</Label>
          <Select name="visibilidad" defaultValue={existing?.visibilidad ?? 'publica'}>
            <SelectTrigger id="visibilidad">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROMO_VISIBILIDADES.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Las privadas solo las ven los miembros de tu empresa; no aparecen
            en el marketplace público.
          </p>
        </div>

        {existing && (
          <div className="flex items-center gap-3">
            <Switch
              id="activo"
              name="activo"
              defaultChecked={existing.activo}
              value="true"
              onCheckedChange={(checked) => {
                const el = document.querySelector<HTMLInputElement>('input[name="activo"]')
                if (el) el.value = String(checked)
              }}
            />
            <Label htmlFor="activo">Promoción activa</Label>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="bg-sky-500 hover:bg-sky-400">
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existing ? 'Guardar cambios' : 'Publicar promoción'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
