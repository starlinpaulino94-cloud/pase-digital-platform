'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ActionResult } from '@/types/auth'
import type { Customer } from '@/modules/clientes/types'

interface CustomerFormProps {
  action: (prev: ActionResult<Customer>, formData: FormData) => Promise<ActionResult<Customer>>
  defaultValues?: Partial<Customer & { user: { email: string; name: string } }>
  isNew?: boolean
  submitLabel?: string
}

const initialState: ActionResult<Customer> = { success: false }

export function CustomerForm({
  action,
  defaultValues,
  isNew = false,
  submitLabel = 'Guardar',
}: CustomerFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={defaultValues?.firstName ?? ''}
            placeholder="Carlos"
            required
          />
          {state.fieldErrors?.firstName && (
            <p className="text-sm text-destructive">{state.fieldErrors.firstName[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={defaultValues?.lastName ?? ''}
            placeholder="Martínez"
            required
          />
          {state.fieldErrors?.lastName && (
            <p className="text-sm text-destructive">{state.fieldErrors.lastName[0]}</p>
          )}
        </div>

        {isNew && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue=""
              placeholder="cliente@email.com"
              required
            />
            {state.fieldErrors?.email && (
              <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>
        )}

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={defaultValues?.phone ?? ''}
            placeholder="809-555-0000"
          />
          {state.fieldErrors?.phone && (
            <p className="text-sm text-destructive">{state.fieldErrors.phone[0]}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
