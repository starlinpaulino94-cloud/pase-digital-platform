'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  crearSucursal,
  actualizarSucursal,
  type SucursalState,
} from '@/modules/admin/sucursalActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'

interface Existing {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  activa: boolean
}

const init: SucursalState = {}

export function SucursalForm({ existing }: { existing?: Existing }) {
  const router = useRouter()
  const action = existing ? actualizarSucursal : crearSucursal
  const [state, formAction, pending] = useActionState(action, init)

  useEffect(() => {
    if (state.success) {
      toast.success(existing ? 'Sucursal actualizada.' : 'Sucursal creada.')
      router.push('/admin/sucursales')
      router.refresh()
    }
  }, [state.success, existing, router])

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {existing && <input type="hidden" name="id" value={existing.id} />}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          name="nombre"
          defaultValue={existing?.nombre}
          placeholder="Ej: Sucursal Norte"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          name="direccion"
          defaultValue={existing?.direccion ?? ''}
          placeholder="Ej: Av. Winston Churchill #45, Santo Domingo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          defaultValue={existing?.telefono ?? ''}
          placeholder="Ej: 809-555-1234"
        />
      </div>

      {existing && (
        <div className="flex items-center gap-3">
          <Switch
            id="activa"
            name="activa"
            defaultChecked={existing.activa}
            onCheckedChange={(checked) => {
              const el = document.querySelector<HTMLInputElement>('input[name="activa"]')
              if (el) el.value = String(checked)
            }}
          />
          <Label htmlFor="activa">Sucursal activa</Label>
          <input type="hidden" name="activa" defaultValue={String(existing.activa)} />
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existing ? 'Guardar cambios' : 'Crear sucursal'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
