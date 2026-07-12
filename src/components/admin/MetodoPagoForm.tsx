'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  crearMetodoPago,
  actualizarMetodoPago,
  type MetodoPagoState,
} from '@/modules/admin/metodoPagoActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'

interface Existing {
  id: string
  tipo: string
  nombre: string
  titular: string | null
  numeroCuenta: string | null
  tipoCuenta: string | null
  instrucciones: string | null
  activo: boolean
}

interface Company {
  id: string
  name: string
}

const init: MetodoPagoState = {}

/**
 * Form de método de pago. Con `companies` (superadmin, alta) muestra el
 * selector de empresa; sin él (panel de empresa) la action usa la empresa
 * de la sesión.
 */
export function MetodoPagoForm({
  existing,
  companies,
}: {
  existing?: Existing
  companies?: Company[]
}) {
  const router = useRouter()
  const action = existing ? actualizarMetodoPago : crearMetodoPago
  const [state, formAction, pending] = useActionState(action, init)

  useEffect(() => {
    if (state.success) {
      toast.success(existing ? 'Método actualizado.' : 'Método creado.')
      router.push('/admin/metodos-pago')
      router.refresh()
    }
  }, [state.success, existing, router])

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {existing && <input type="hidden" name="id" value={existing.id} />}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {!existing && companies && (
        <div className="space-y-2">
          <Label htmlFor="companyId">Empresa *</Label>
          <Select name="companyId" required>
            <SelectTrigger id="companyId">
              <SelectValue placeholder="Selecciona la empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!existing && (
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de método *</Label>
          <Select name="tipo" defaultValue="TRANSFERENCIA" required>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRANSFERENCIA">Transferencia bancaria</SelectItem>
              <SelectItem value="PRESENCIAL">Pago presencial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre del método *</Label>
        <Input
          id="nombre"
          name="nombre"
          defaultValue={existing?.nombre}
          placeholder="Ej: BHD León · Transferencia"
          required
        />
      </div>

      {(!existing || existing.tipo === 'TRANSFERENCIA') && (
        <>
          <div className="space-y-2">
            <Label htmlFor="titular">Titular de la cuenta</Label>
            <Input
              id="titular"
              name="titular"
              defaultValue={existing?.titular ?? ''}
              placeholder="Ej: CARTOWN WASH SRL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroCuenta">Número de cuenta</Label>
              <Input
                id="numeroCuenta"
                name="numeroCuenta"
                defaultValue={existing?.numeroCuenta ?? ''}
                placeholder="Ej: 27190123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoCuenta">Tipo de cuenta</Label>
              <Input
                id="tipoCuenta"
                name="tipoCuenta"
                defaultValue={existing?.tipoCuenta ?? ''}
                placeholder="Ej: Corriente"
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="instrucciones">Instrucciones adicionales</Label>
        <Textarea
          id="instrucciones"
          name="instrucciones"
          defaultValue={existing?.instrucciones ?? ''}
          rows={3}
          placeholder="Ej: Incluye tu nombre y número de cédula en el concepto de la transferencia."
        />
      </div>

      {existing && (
        <div className="flex items-center gap-3">
          <Switch
            id="activo"
            name="activo"
            defaultChecked={existing.activo}
            value="true"
            onCheckedChange={(checked) => {
              const el = document.querySelector<HTMLInputElement>('input[name="activo"]')
              if (el) el.value = String(checked)
            }}
          />
          <Label htmlFor="activo">Método activo</Label>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existing ? 'Guardar cambios' : 'Crear método'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
