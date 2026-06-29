'use client'

import { useTransition } from 'react'
import { deleteVehicleAction, setDefaultVehicleAction } from '@/modules/vehiculos/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Vehicle } from '@/modules/vehiculos/types'

interface VehicleListProps {
  vehicles: Vehicle[]
}

export function VehicleList({ vehicles }: VehicleListProps) {
  const [isPending, startTransition] = useTransition()

  if (vehicles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No tienes vehículos registrados aún.</p>
      </div>
    )
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este vehículo?')) return
    startTransition(async () => {
      await deleteVehicleAction(id)
    })
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      await setDefaultVehicleAction(id)
    })
  }

  return (
    <div className="space-y-3">
      {vehicles.map((v) => (
        <div
          key={v.id}
          className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-foreground text-sm">
                {v.year} {v.make} {v.model}
              </p>
              {v.isDefault && (
                <Badge variant="secondary" className="text-xs">Principal</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {v.color}{v.plate ? ` · ${v.plate}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!v.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleSetDefault(v.id)}
              >
                Marcar principal
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => handleDelete(v.id)}
              className="text-destructive hover:text-destructive"
            >
              Eliminar
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
