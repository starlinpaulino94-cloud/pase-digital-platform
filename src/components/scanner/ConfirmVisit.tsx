'use client'

import Image from 'next/image'
import { useActionState, useEffect, useState } from 'react'
import { Loader2, XCircle, AlertTriangle, Clock, User } from 'lucide-react'
import { toast } from 'sonner'
import {
  confirmarVisita,
  type ClienteLookup,
  type ConfirmState,
} from '@/modules/visitas/actions'
import { ComprobanteReceipt } from '@/components/scanner/ComprobanteReceipt'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EstadoBadge } from '@/components/EstadoBadge'
import type { MembershipEstado } from '@/types'

interface Sucursal {
  id: string
  nombre: string
}

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

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function ConfirmVisit({
  cliente,
  sucursales = [],
  onDone,
}: {
  cliente: ClienteLookup
  sucursales?: Sucursal[]
  onDone: () => void
}) {
  const [servicio, setServicio] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [sucursalId, setSucursalId] = useState('')
  const [state, formAction, pending] = useActionState(confirmarVisita, initial)

  const isCarwash = cliente.vehiculos.length > 0
  const servicios = isCarwash ? SERVICIOS_CARWASH : SERVICIOS_RESTAURANTE

  useEffect(() => {
    if (state.success) toast.success('Visita confirmada.')
    if (state.error) toast.error(state.error)
  }, [state.success, state.error])

  // Post-confirmation: show printable receipt
  if (state.success && state.visitId) {
    return (
      <ComprobanteReceipt
        cliente={cliente}
        visitId={state.visitId}
        servicio={state.servicio ?? servicio}
        restantes={state.restantes ?? 0}
        onDone={onDone}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Client card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {cliente.avatarUrl ? (
              <Image
                src={cliente.avatarUrl}
                alt={cliente.nombre}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-sky-100"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
                <User className="h-7 w-7 text-sky-500" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-lg font-bold text-slate-900 leading-tight">
                  {cliente.nombre}
                </p>
                <p className="text-sm text-slate-500">{cliente.empresa}</p>
              </div>
              {cliente.estado && (
                <EstadoBadge estado={cliente.estado as MembershipEstado} />
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="font-medium">{cliente.planNombre ?? '—'}</span>
              {!cliente.esIlimitado && (
                <Badge
                  variant="secondary"
                  className={
                    cliente.lavadosRestantes <= 1
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  }
                >
                  {cliente.lavadosRestantes} usos restantes
                </Badge>
              )}
              {cliente.esIlimitado && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Ilimitado
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {cliente.alertas.length > 0 && (
          <div className="mt-3 space-y-1">
            {cliente.alertas.map((alerta) => (
              <div
                key={alerta}
                className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {alerta}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent visits */}
      {cliente.visitasRecientes.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Visitas recientes
          </p>
          <ul className="space-y-1.5">
            {cliente.visitasRecientes.map((v) => (
              <li key={v.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{v.servicio}</span>
                <span className="text-xs text-slate-400">{fmtDate(v.fecha)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cannot use */}
      {!cliente.puedeUsar ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {cliente.mensaje ?? 'No se puede registrar la visita.'}
          </AlertDescription>
        </Alert>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="membershipId" value={cliente.membershipId ?? ''} />
          <input type="hidden" name="servicio" value={servicio} />
          <input type="hidden" name="vehiculoId" value={vehiculoId} />
          <input type="hidden" name="sucursalId" value={sucursalId} />

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Sucursal */}
          {sucursales.length > 0 && (
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select value={sucursalId} onValueChange={setSucursalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona sucursal (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Service */}
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

          {/* Vehicle */}
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
            <Textarea id="notas" name="notas" rows={2} placeholder="Observaciones opcionales..." />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={pending || !servicio}
              className="flex-1 bg-green-600 hover:bg-green-500"
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar visita
            </Button>
            <Button type="button" variant="outline" onClick={onDone}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {!cliente.puedeUsar && (
        <Button onClick={onDone} variant="outline" className="w-full">
          Escanear otro
        </Button>
      )}
    </div>
  )
}
