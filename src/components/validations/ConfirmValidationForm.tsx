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

interface ConfirmValidationFormProps {
  validationId: string
  activeAssignments: ActiveAssignment[]
}

export function ConfirmValidationForm({ validationId, activeAssignments }: ConfirmValidationFormProps) {
  const [state, formAction, pending] = useActionState(confirmValidationAction, initialState)

  if (state.success) {
    return (
      <Alert>
        <AlertDescription>
          ✓ Validación confirmada. Comprobante emitido.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" name="validationId" value={validationId} />

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

      <div className="space-y-1.5">
        <Label htmlFor="externalInvoiceId">N° de comprobante externo</Label>
        <Input
          id="externalInvoiceId"
          name="externalInvoiceId"
          placeholder="Opcional: número de factura del sistema propio"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Confirmando...' : 'Confirmar y consumir uso'}
      </Button>
    </form>
  )
}
