'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActionResult } from '@/types/auth'
import type { Promotion, PromotionType } from '@/modules/promociones/types'

const TYPE_LABELS: Record<PromotionType, string> = {
  COUPON:          'Cupón',
  DISCOUNT:        'Descuento',
  PLAN:            'Plan',
  MEMBERSHIP:      'Membresía',
  VISIT_BASED:     'Por Visitas',
  TEMPORARY_OFFER: 'Oferta Temporal',
  BUNDLE:          'Bundle',
  CASHBACK:        'Cashback',
  REFERRAL:        'Referido',
}

const ALL_TYPES = Object.keys(TYPE_LABELS) as PromotionType[]

interface PromotionFormProps {
  action: (prev: ActionResult<Promotion>, formData: FormData) => Promise<ActionResult<Promotion>>
  defaultValues?: Partial<Promotion>
  isNew?: boolean
  submitLabel?: string
}

const initialState: ActionResult<Promotion> = { success: false }

function toDatetimeLocal(value?: Date | string | null): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
}

export function PromotionForm({
  action,
  defaultValues,
  isNew = false,
  submitLabel = 'Guardar',
}: PromotionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  const existingConfig = defaultValues?.config
    ? JSON.stringify(defaultValues.config, null, 2)
    : '{}'

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Hidden config — preserves existing config on edit; defaults to {} on create */}
      <input type="hidden" name="config" value={existingConfig} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name ?? ''}
            placeholder="Ej: Descuento de bienvenida 20%"
            required
          />
          {state.fieldErrors?.name && (
            <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description ?? ''}
            placeholder="Descripción visible para el cliente..."
            rows={3}
          />
          {state.fieldErrors?.description && (
            <p className="text-sm text-destructive">{state.fieldErrors.description[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Tipo *</Label>
          <Select
            name="type"
            defaultValue={defaultValues?.type ?? 'DISCOUNT'}
            disabled={!isNew}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {ALL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isNew && (
            <p className="text-xs text-muted-foreground">El tipo no se puede cambiar.</p>
          )}
          {state.fieldErrors?.type && (
            <p className="text-sm text-destructive">{state.fieldErrors.type[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maxUses">Usos máximos totales</Label>
          <Input
            id="maxUses"
            name="maxUses"
            type="number"
            min={1}
            defaultValue={defaultValues?.maxUses ?? ''}
            placeholder="Sin límite"
          />
          <p className="text-xs text-muted-foreground">Vacío = ilimitado</p>
          {state.fieldErrors?.maxUses && (
            <p className="text-sm text-destructive">{state.fieldErrors.maxUses[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startsAt">Fecha de inicio</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(defaultValues?.startsAt)}
          />
          {state.fieldErrors?.startsAt && (
            <p className="text-sm text-destructive">{state.fieldErrors.startsAt[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expiresAt">Fecha de expiración</Label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(defaultValues?.expiresAt)}
          />
          {state.fieldErrors?.expiresAt && (
            <p className="text-sm text-destructive">{state.fieldErrors.expiresAt[0]}</p>
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
