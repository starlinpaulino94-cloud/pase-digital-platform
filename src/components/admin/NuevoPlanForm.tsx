'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { crearPlan } from '@/modules/admin/planActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Company {
  id: string
  name: string
}

export function NuevoPlanForm({ companies }: { companies: Company[] }) {
  const [state, action, pending] = useActionState(crearPlan, {})
  const router = useRouter()

  useEffect(() => {
    if (state.success) router.push('/superadmin/planes')
  }, [state.success, router])

  return (
    <form action={action} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="companyId">Empresa</Label>
        <select
          id="companyId"
          name="companyId"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Seleccionar empresa…</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre del plan</Label>
        <Input id="nombre" name="nombre" required placeholder="Ej: Silver, Gold, Platinum" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="precio">Precio (RD$)</Label>
          <Input id="precio" name="precio" type="number" min="0" step="0.01" required placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lavados">Lavados incluidos</Label>
          <Input id="lavados" name="lavados" type="number" min="0" placeholder="0" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="esIlimitado" name="esIlimitado" className="h-4 w-4 rounded border-slate-300" />
        <Label htmlFor="esIlimitado">Lavados ilimitados</Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Input id="descripcion" name="descripcion" placeholder="Descripción breve del plan" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="beneficios">Beneficios (uno por línea)</Label>
        <textarea
          id="beneficios"
          name="beneficios"
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder={"Lavado exterior completo\nSecado con soplador\nAromatización"}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creando…' : 'Crear plan'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
