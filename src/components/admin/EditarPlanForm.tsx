'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { actualizarPlan } from '@/modules/admin/planActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Plan {
  id: string
  nombre: string
  precio: unknown
  lavadosIncluidos: number
  esIlimitado: boolean
  descripcion: string | null
  beneficios: string[]
  activo: boolean
}

export function EditarPlanForm({ plan }: { plan: Plan }) {
  const [state, action, pending] = useActionState(actualizarPlan, {})
  const router = useRouter()

  useEffect(() => {
    if (state.success) router.push('/superadmin/planes')
  }, [state.success, router])

  return (
    <form action={action} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
      <input type="hidden" name="planId" value={plan.id} />

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre del plan</Label>
        <Input id="nombre" name="nombre" required defaultValue={plan.nombre} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="precio">Precio (RD$)</Label>
          <Input id="precio" name="precio" type="number" min="0" step="0.01" required defaultValue={String(plan.precio)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lavados">Lavados incluidos</Label>
          <Input id="lavados" name="lavados" type="number" min="0" defaultValue={plan.lavadosIncluidos} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="esIlimitado" name="esIlimitado" defaultChecked={plan.esIlimitado} className="h-4 w-4 rounded border-slate-300" />
        <Label htmlFor="esIlimitado">Lavados ilimitados</Label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="activo" name="activo" defaultChecked={plan.activo} className="h-4 w-4 rounded border-slate-300" />
        <Label htmlFor="activo">Plan activo (visible para clientes)</Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Input id="descripcion" name="descripcion" defaultValue={plan.descripcion ?? ''} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="beneficios">Beneficios (uno por línea)</Label>
        <textarea
          id="beneficios"
          name="beneficios"
          rows={4}
          defaultValue={plan.beneficios.join('\n')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
