'use client'

import { useActionState } from 'react'
import type { ActionResult } from '@/types/auth'
import { updateProfileSelfAction } from '@/modules/clientes/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Customer } from '@/modules/clientes/types'

const initial: ActionResult<Customer> = { success: false, error: '' }

export function UpdateProfileForm({ customer }: { customer: Customer }) {
  const [state, action, pending] = useActionState(updateProfileSelfAction, initial)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="firstName">Nombre</Label>
        <Input
          id="firstName"
          name="firstName"
          defaultValue={customer.firstName}
          required
        />
        {state.fieldErrors?.firstName && (
          <p className="text-xs text-destructive">{state.fieldErrors.firstName[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="lastName">Apellido</Label>
        <Input
          id="lastName"
          name="lastName"
          defaultValue={customer.lastName}
          required
        />
        {state.fieldErrors?.lastName && (
          <p className="text-xs text-destructive">{state.fieldErrors.lastName[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={customer.phone ?? ''}
        />
        {state.fieldErrors?.phone && (
          <p className="text-xs text-destructive">{state.fieldErrors.phone[0]}</p>
        )}
      </div>

      {state.error && !state.success && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-600">Perfil actualizado.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
