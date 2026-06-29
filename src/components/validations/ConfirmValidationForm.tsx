'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { confirmValidationAction } from '@/modules/validacion-qr/actions'
import { SERVICE_TYPES, SERVICE_TYPE_LABELS } from '@/modules/validacion-qr/validations'
import type { ActionResult } from '@/types/auth'
import type { ValidationSession, Receipt } from '@/modules/validacion-qr/types'

const initialState: ActionResult<{ validation: ValidationSession; receipt: Receipt }> = {
  success: false,
}

interface ActiveAssignment {
  id: string
  promotionName: string
  promotionType: string
  usesConsumed: number
  usesAllowed: number | null
  expiresAt: string | null
}

interface VehicleOption {
  id: string
  make: string
  model: string
  year: number
  color: string
  plate: string | null
  isDefault: boolean
}

interface ConfirmValidationFormProps {
  validationId: string
  activeAssignments: ActiveAssignment[]
  vehicles?: VehicleOption[]
}

export function ConfirmValidationForm({
  validationId,
  activeAssignments,
  vehicles = [],
}: ConfirmValidationFormProps) {
  const [state, formAction, pending] = useActionState(confirmValidationAction, initialState)

  if (state.success) {
    return (
      <Alert>
        <AlertDescription>
          Validación confirmada. Comprobante emitido.
        </AlertDescription>
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

      <input type="hidden" name="validationId" value={validationId} />

      {/* Promotion */}
      <div className="space-y-1.5">
        <Label htmlFor="assignmentId">Promoción a consumir *</Label>
        <Select name="assignmentId" required>
          <SelectTrigger id="assignmentId">
            <SelectValue placeholder="Seleccionar promoción" />
          </SelectTrigger>
          <SelectContent>
            {activeAssignments.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.promotionName} · {a.usesConsumed}{a.usesAllowed != null ? `/${a.usesAllowed}` : ''} usos
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.assignmentId && (
          <p className="text-sm text-destructive">{state.fieldErrors.assignmentId[0]}</p>
        )}
      </div>

      {/* Service type */}
      <div className="space-y-1.5">
        <Label htmlFor="serviceType">Tipo de servicio *</Label>
        <Select name="serviceType" required>
          <SelectTrigger id="serviceType">
            <SelectValue placeholder="Seleccionar servicio" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {SERVICE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.serviceType && (
          <p className="text-sm text-destructive">{state.fieldErrors.serviceType[0]}</p>
        )}
      </div>

      {/* Vehicle selector (optional) */}
      {vehicles.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="vehicleId">Vehículo</Label>
          <Select name="vehicleId">
            <SelectTrigger id="vehicleId">
              <SelectValue placeholder="Seleccionar vehículo (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} · {v.color}
                  {v.plate ? ` · ${v.plate}` : ''}
                  {v.isDefault ? ' (principal)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* External invoice */}
      <div className="space-y-1.5">
        <Label htmlFor="externalInvoiceId">N° de comprobante externo</Label>
        <Input
          id="externalInvoiceId"
          name="externalInvoiceId"
          placeholder="Opcional: número de factura"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Confirmando...' : 'Confirmar servicio'}
      </Button>
    </form>
  )
}
