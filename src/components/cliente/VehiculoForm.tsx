'use client'

import { useActionState, useEffect } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { agregarVehiculo, type ProfileState } from '@/modules/cliente/profileActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const init: ProfileState = {}

export function VehiculoForm() {
  const [state, formAction, pending] = useActionState(agregarVehiculo, init)

  useEffect(() => {
    if (state.success) toast.success('Vehículo agregado.')
    if (state.error) toast.error(state.error)
  }, [state.success, state.error])

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="marca">Marca *</Label>
          <Input id="marca" name="marca" placeholder="Toyota" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modelo">Modelo *</Label>
          <Input id="modelo" name="modelo" placeholder="Corolla" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="anio">Año *</Label>
          <Input
            id="anio"
            name="anio"
            type="number"
            placeholder={String(new Date().getFullYear())}
            min={1990}
            max={new Date().getFullYear() + 1}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="color">Color *</Label>
          <Input id="color" name="color" placeholder="Blanco" required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="placa">Placa</Label>
          <Input id="placa" name="placa" placeholder="A123456" />
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        variant="outline"
        className="gap-2"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Agregar vehículo
      </Button>
    </form>
  )
}
