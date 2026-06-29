'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createVehicleAction } from '@/modules/vehiculos/actions'
import type { ActionResult } from '@/types/auth'
import type { Vehicle } from '@/modules/vehiculos/types'

const initialState: ActionResult<Vehicle> = { success: false }
const currentYear = new Date().getFullYear()

export function AddVehicleForm() {
  const [state, formAction, pending] = useActionState(createVehicleAction, initialState)

  if (state.success) {
    return (
      <Alert>
        <AlertDescription>Vehículo agregado correctamente.</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="make">Marca *</Label>
          <Input id="make" name="make" placeholder="Toyota" required />
          {state.fieldErrors?.make && (
            <p className="text-xs text-destructive">{state.fieldErrors.make[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Modelo *</Label>
          <Input id="model" name="model" placeholder="Corolla" required />
          {state.fieldErrors?.model && (
            <p className="text-xs text-destructive">{state.fieldErrors.model[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="year">Año *</Label>
          <Input
            id="year"
            name="year"
            type="number"
            min={1950}
            max={currentYear + 1}
            placeholder={String(currentYear)}
            required
          />
          {state.fieldErrors?.year && (
            <p className="text-xs text-destructive">{state.fieldErrors.year[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="color">Color *</Label>
          <Input id="color" name="color" placeholder="Blanco" required />
          {state.fieldErrors?.color && (
            <p className="text-xs text-destructive">{state.fieldErrors.color[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plate">Placa</Label>
        <Input id="plate" name="plate" placeholder="A123456 (opcional)" />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Guardando...' : 'Agregar vehículo'}
      </Button>
    </form>
  )
}
