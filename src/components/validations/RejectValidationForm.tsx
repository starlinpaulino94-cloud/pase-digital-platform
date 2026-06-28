'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { rejectValidationAction } from '@/modules/validacion-qr/actions'
import type { ActionResult } from '@/types/auth'
import type { ValidationSession } from '@/modules/validacion-qr/types'

const initialState: ActionResult<ValidationSession> = { success: false }

export function RejectValidationForm({ validationId }: { validationId: string }) {
  const [state, formAction, pending] = useActionState(rejectValidationAction, initialState)

  if (state.success) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Validación rechazada.</AlertDescription>
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

      <div className="space-y-1.5">
        <Label htmlFor="reason">Motivo de rechazo *</Label>
        <Textarea
          id="reason"
          name="reason"
          rows={2}
          placeholder="Ej: QR inválido, promoción no aplicable..."
          required
        />
        {state.fieldErrors?.reason && (
          <p className="text-sm text-destructive">{state.fieldErrors.reason[0]}</p>
        )}
      </div>

      <Button type="submit" variant="destructive" disabled={pending} className="w-full">
        {pending ? 'Rechazando...' : 'Rechazar validación'}
      </Button>
    </form>
  )
}
