'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  crearCampana,
  actualizarCampana,
  type CampanaState,
} from '@/modules/admin/campanaActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'

interface ExistingCampana {
  id: string
  nombre: string
  descripcion: string | null
  fechaInicio: Date | null
  fechaFin: Date | null
  activo: boolean
}

const init: CampanaState = {}

function toDateInput(d: Date | null) {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

export function CampanaForm({ existing }: { existing?: ExistingCampana }) {
  const router = useRouter()
  const action = existing ? actualizarCampana : crearCampana
  const [state, formAction, pending] = useActionState(action, init)

  useEffect(() => {
    if (state.success) {
      toast.success(existing ? 'Campaña actualizada.' : 'Campaña creada.')
      router.push('/admin/campanas')
      router.refresh()
    }
  }, [state.success, existing, router])

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      {existing && <input type="hidden" name="id" value={existing.id} />}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre de la campaña *</Label>
        <Input
          id="nombre"
          name="nombre"
          defaultValue={existing?.nombre}
          placeholder="Ej: Black Friday 2026"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={existing?.descripcion ?? ''}
          placeholder="Objetivo de la campaña"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fechaInicio">Inicio</Label>
          <Input
            id="fechaInicio"
            name="fechaInicio"
            type="date"
            defaultValue={toDateInput(existing?.fechaInicio ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fechaFin">Fin</Label>
          <Input
            id="fechaFin"
            name="fechaFin"
            type="date"
            defaultValue={toDateInput(existing?.fechaFin ?? null)}
          />
        </div>
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
          <Label htmlFor="activo">Campaña activa</Label>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existing ? 'Guardar cambios' : 'Crear campaña'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
