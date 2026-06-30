'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  XCircle,
  AlertTriangle,
  Printer,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  confirmarVisita,
  type ClienteLookup,
  type ConfirmState,
} from '@/modules/visitas/actions'
import { Button } from '@/components/ui/button'
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
import { EstadoBadge } from '@/components/EstadoBadge'
import type { MembershipEstado } from '@/types'

const SERVICIOS_CARWASH = [
  'Lavado básico',
  'Lavado premium',
  'Aspirado completo',
  'Detallado',
  'Aromatizante',
]
const SERVICIOS_RESTAURANTE = [
  'Menú ejecutivo',
  'Comida premium',
  'Bebida premium',
  'Postre',
  'Consumo general',
]

const initial: ConfirmState = {}

export function ConfirmVisit({
  cliente,
  onDone,
}: {
  cliente: ClienteLookup
  onDone: () => void
}) {
  const [servicio, setServicio] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [state, formAction, pending] = useActionState(confirmarVisita, initial)

  const isCarwash = cliente.vehiculos.length > 0
  const servicios = isCarwash ? SERVICIOS_CARWASH : SERVICIOS_RESTAURANTE

  useEffect(() => {
    if (state.success) {
      toast.success('Uso confirmado. Se generó un nuevo QR para el cliente.')
    }
  }, [state.success])

  // Caso: QR ya consumido — mostrar info de auditoría
  if (cliente.consumidoInfo) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold">Este QR ya fue utilizado.</p>
            <p className="mt-1 text-sm">
              Se generó un nuevo QR automáticamente para el cliente.
            </p>
          </AlertDescription>
        </Alert>
        <div className="rounded-lg border bg-slate-50 p-4 text-sm">
          <p className="mb-2 font-semibold text-slate-700">
            Registro de uso anterior:
          </p>
          <dl className="space-y-1 text-slate-600">
            <div className="flex justify-between">
              <dt>Fecha:</dt>
              <dd>
                {cliente.consumidoInfo.fecha
                  ? new Date(cliente.consumidoInfo.fecha).toLocaleString('es-DO')
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Empresa:</dt>
              <dd>{cliente.consumidoInfo.empresa}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Sucursal:</dt>
              <dd>{cliente.consumidoInfo.sucursal ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Validado por:</dt>
              <dd>{cliente.consumidoInfo.usuario ?? '—'}</dd>
            </div>
          </dl>
        </div>
        <Button onClick={onDone} className="w-full bg-sky-500 hover:bg-sky-400">
          Escanear otro QR
        </Button>
      </div>
    )
  }

  // Caso: uso confirmado — mostrar éxito + nuevo QR + comprobante
  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        <h3 className="text-xl font-bold">Uso confirmado</h3>
        <div className="rounded-lg border bg-slate-50 p-4 text-sm">
          {cliente.esIlimitado ? (
            <p className="text-slate-600">Plan ilimitado — sin descuento.</p>
          ) : (
            <p className="text-slate-600">
              Servicios restantes: <strong>{state.restantes}</strong>
            </p>
          )}
          {state.receiptNumero && (
            <p className="mt-1 text-slate-600">
              Comprobante de consumo: <strong>#{state.receiptNumero}</strong>
            </p>
          )}
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-700">
            <RefreshCw className="h-3.5 w-3.5" />
            Se generó un nuevo QR para el cliente
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button
            onClick={onDone}
            className="flex-1 bg-sky-500 hover:bg-sky-400"
          >
            Escanear otro
          </Button>
        </div>
      </div>
    )
  }

  // Caso: no puede usar (sin membresía activa o sin usos)
  if (!cliente.puedeUsar) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {cliente.mensaje ?? 'No se puede registrar el uso.'}
          </AlertDescription>
        </Alert>
        <Button onClick={onDone} variant="outline" className="w-full">
          Escanear otro QR
        </Button>
      </div>
    )
  }

  // Caso: formulario de confirmación
  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{cliente.nombre}</p>
            <p className="text-sm text-slate-500">{cliente.empresa}</p>
          </div>
          {cliente.estado && (
            <EstadoBadge estado={cliente.estado as MembershipEstado} />
          )}
        </div>
        <div className="mt-3 text-sm text-slate-600">
          <p>Plan: {cliente.planNombre ?? '—'}</p>
          <p>
            {cliente.esIlimitado
              ? 'Usos ilimitados'
              : `Usos restantes: ${cliente.lavadosRestantes}`}
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="membershipId" value={cliente.membershipId ?? ''} />
        <input type="hidden" name="servicio" value={servicio} />
        <input type="hidden" name="vehiculoId" value={vehiculoId} />
        <input type="hidden" name="qrToken" value={cliente.qrToken} />

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Servicio *</Label>
          <Select value={servicio} onValueChange={setServicio}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un servicio" />
            </SelectTrigger>
            <SelectContent>
              {servicios.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {cliente.vehiculos.length > 0 && (
          <div className="space-y-2">
            <Label>Vehículo</Label>
            <Select value={vehiculoId} onValueChange={setVehiculoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un vehículo" />
              </SelectTrigger>
              <SelectContent>
                {cliente.vehiculos.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notas">Notas</Label>
          <Textarea id="notas" name="notas" rows={2} />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={pending || !servicio}
            className="flex-1 bg-green-600 hover:bg-green-500"
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar uso
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
