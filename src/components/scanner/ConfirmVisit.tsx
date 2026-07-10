'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Loader2,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  CreditCard,
  Gift,
  Sparkles,
  Shield,
  Megaphone,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'

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
// Cualquier otro tipo de negocio: opciones neutras, sin asumir la industria.
const SERVICIOS_GENERICOS = [
  'Uso de membresía',
  'Servicio estándar',
  'Servicio premium',
  'Producto incluido',
  'Otro beneficio',
]

const initial: ConfirmState = {}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(iso))
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso)
  )
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof User }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
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

  // Defensa contra payloads incompletos (bundle viejo en el teléfono + acción
  // nueva en el servidor, o viceversa): nunca dejar que un campo faltante
  // tumbe la pantalla del scanner.
  const vehiculos = cliente.vehiculos ?? []
  const planBeneficios = cliente.planBeneficios ?? []
  const alertas = cliente.alertas ?? []
  const visitasRecientes = cliente.visitasRecientes ?? []

  // Los servicios sugeridos dependen del tipo de negocio; nunca se asume
  // Car Wash por defecto: cualquier industria no contemplada usa la lista
  // genérica.
  const isCarwash = cliente.empresaType === 'carwash' || vehiculos.length > 0
  const servicios = isCarwash
    ? SERVICIOS_CARWASH
    : cliente.empresaType === 'restaurante'
      ? SERVICIOS_RESTAURANTE
      : SERVICIOS_GENERICOS
  const isValid = cliente.puedeUsar

  useEffect(() => {
    if (state.success) toast.success('Visita confirmada correctamente.')
    if (state.error) toast.error(state.error)
  }, [state.success, state.error])

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
    <div className="space-y-4">
      {/* Status banner */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl px-4 py-3',
          isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        )}
      >
        {isValid ? (
          <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
        ) : (
          <XCircle className="h-6 w-6 shrink-0 text-red-600" />
        )}
        <div>
          <p className={cn('font-bold', isValid ? 'text-green-800' : 'text-red-800')}>
            {isValid ? 'Membresía válida' : 'Membresía inválida'}
          </p>
          {!isValid && cliente.mensaje && (
            <p className="text-sm text-red-700">{cliente.mensaje}</p>
          )}
        </div>
      </div>

      {/* Client card */}
      <div
        className={cn(
          'rounded-xl border-2 p-4',
          isValid ? 'border-green-200 bg-white' : 'border-red-200 bg-white'
        )}
      >
        <div className="flex items-start gap-4">
          {cliente.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cliente.avatarUrl}
              alt={cliente.nombre}
              width={64}
              height={64}
              className={cn(
                'h-16 w-16 rounded-2xl object-cover ring-2',
                isValid ? 'ring-green-200' : 'ring-red-200'
              )}
            />
          ) : (
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl',
                isValid ? 'bg-green-100' : 'bg-red-100'
              )}
            >
              <User className={cn('h-8 w-8', isValid ? 'text-green-600' : 'text-red-600')} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-foreground leading-tight">{cliente.nombre}</p>
            <p className="text-sm text-muted-foreground">{cliente.empresa}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge
                className={cn(
                  'text-[10px]',
                  cliente.estado === 'ACTIVA'
                    ? 'bg-green-100 text-green-700'
                    : cliente.estado === 'VENCIDA'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-slate-200 text-slate-600'
                )}
              >
                {cliente.estado ?? 'Sin membresía'}
              </Badge>
              {cliente.esIlimitado && (
                <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                  <Sparkles className="mr-1 h-3 w-3" /> Ilimitado
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-0.5 border-t border-border/60 pt-3">
          <InfoRow label="Plan" value={cliente.planNombre ?? 'Sin plan'} icon={CreditCard} />
          <InfoRow
            label="Usos restantes"
            value={cliente.esIlimitado ? 'Ilimitado' : `${cliente.lavadosRestantes} de ${cliente.lavadosIncluidos}`}
            icon={Gift}
          />
          <InfoRow label="Inicio" value={fmtDate(cliente.fechaInicio)} icon={Calendar} />
          <InfoRow label="Vencimiento" value={fmtDate(cliente.fechaVencimiento)} icon={Calendar} />
          <InfoRow
            label="Total visitas"
            value={String(cliente.totalVisitas)}
            icon={Shield}
          />
          <InfoRow
            label="Último uso"
            value={cliente.ultimoUso ? fmtDateTime(cliente.ultimoUso) : 'Primera vez'}
            icon={Clock}
          />
        </div>

        {/* Beneficios */}
        {planBeneficios.length > 0 && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Beneficios incluidos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {planBeneficios.map((b) => (
                <Badge key={b} variant="secondary" className="text-xs bg-sky-50 text-sky-700">
                  {b}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Promociones */}
        {cliente.promocionesActivas > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5 text-violet-500" />
            <span>{cliente.promocionesActivas} promoción{cliente.promocionesActivas !== 1 ? 'es' : ''} disponible{cliente.promocionesActivas !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Alerts */}
      {alertas.length > 0 && (
        <div className="space-y-1.5">
          {alertas.map((alerta) => (
            <div
              key={alerta}
              className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {alerta}
            </div>
          ))}
        </div>
      )}

      {/* Recent visits */}
      {visitasRecientes.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Últimas visitas
          </p>
          <div className="space-y-1">
            {visitasRecientes.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{v.servicio}</span>
                <span className="text-xs text-muted-foreground">{fmtDateTime(v.fecha)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action area */}
      {!isValid ? (
        <div className="space-y-3">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {cliente.mensaje ?? 'No se puede registrar esta visita.'}
            </AlertDescription>
          </Alert>
          <Button onClick={onDone} variant="outline" className="w-full">
            Escanear otro QR
          </Button>
        </div>
      ) : (
        <form action={formAction} className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <input type="hidden" name="membershipId" value={cliente.membershipId ?? ''} />
          <input type="hidden" name="qrTokenId" value={cliente.qrTokenId ?? ''} />
          <input type="hidden" name="servicio" value={servicio} />
          <input type="hidden" name="vehiculoId" value={vehiculoId} />
          <input type="hidden" name="sucursalId" value={sucursalId} />

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm font-semibold text-foreground">Registrar visita</p>

          {sucursales.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Sucursal</Label>
              <Select value={sucursalId} onValueChange={setSucursalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona sucursal (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Servicio *</Label>
            <Select value={servicio} onValueChange={setServicio}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {servicios.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {vehiculos.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Vehículo</Label>
              <Select value={vehiculoId} onValueChange={setVehiculoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona vehículo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {vehiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notas" className="text-xs">Notas</Label>
            <Textarea id="notas" name="notas" rows={2} placeholder="Observaciones opcionales…" />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={pending || !servicio}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold"
              size="lg"
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar uso
            </Button>
            <Button type="button" variant="outline" onClick={onDone} size="lg">
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
