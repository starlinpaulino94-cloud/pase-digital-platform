'use client'

import { useActionState, useEffect, useState } from 'react'
import { Landmark, Store, CheckCircle2, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import {
  avisarPagoPresencial,
  type PresencialState,
} from '@/modules/membresia/actions'
import { ComprobanteForm } from '@/components/membresia/ComprobanteForm'
import { Button } from '@/components/ui/button'
import { cn } from '@membego/ui/cn'

interface MetodoTransferencia {
  id: string
  nombre: string
  titular: string | null
  numeroCuenta: string | null
  tipoCuenta: string | null
  instrucciones: string | null
}

interface MetodoPresencial {
  id: string
  nombre: string
  instrucciones: string | null
}

interface Props {
  membershipId: string
  companyName: string
  transferencias: MetodoTransferencia[]
  presenciales: MetodoPresencial[]
  /** true = el cliente ya avisó que pagará en la sucursal. */
  avisoPresencialEnviado: boolean
}

const initial: PresencialState = {}

/**
 * Dos formas de pagar un plan (o un cambio de plan):
 *  - Transferencia: datos bancarios + subir comprobante (flujo existente).
 *  - Presencial: el cliente avisa y paga en la sucursal; el encargado
 *    confirma el pago al recibirlo y el plan se activa.
 */
export function OpcionesPago({
  membershipId,
  companyName,
  transferencias,
  presenciales,
  avisoPresencialEnviado,
}: Props) {
  const [opcion, setOpcion] = useState<'transferencia' | 'presencial'>(
    avisoPresencialEnviado ? 'presencial' : 'transferencia'
  )
  const [state, formAction, pending] = useActionState(avisarPagoPresencial, initial)

  useEffect(() => {
    if (state.success) toast.success('Aviso enviado. Te esperamos en la sucursal.')
    if (state.error) toast.error(state.error)
  }, [state])

  const avisado = avisoPresencialEnviado || state.success === true
  const sucursal = presenciales[0] ?? null

  return (
    <div className="space-y-5">
      {/* Selector de forma de pago */}
      <div>
        <h3 className="text-sm font-medium text-foreground">¿Cómo prefieres pagar?</h3>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(
            [
              { key: 'transferencia', icon: Landmark, titulo: 'Transferencia', detalle: 'Paga desde tu banco y sube el comprobante' },
              { key: 'presencial', icon: Store, titulo: 'En la sucursal', detalle: 'Paga en persona al visitar el local' },
            ] as const
          ).map(({ key, icon: Icon, titulo, detalle }) => (
            <button
              key={key}
              type="button"
              onClick={() => setOpcion(key)}
              aria-pressed={opcion === key}
              className={cn(
                'rounded-2xl border p-4 text-left transition',
                opcion === key
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border/70 bg-card hover:border-primary/40'
              )}
            >
              <Icon
                className={cn('h-5 w-5', opcion === key ? 'text-primary' : 'text-muted-foreground')}
                aria-hidden
              />
              <p className="mt-2 text-sm font-semibold text-foreground">{titulo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{detalle}</p>
            </button>
          ))}
        </div>
      </div>

      {opcion === 'transferencia' ? (
        <div className="space-y-5">
          {transferencias.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Datos para el pago</h3>
              {transferencias.map((m) => (
                <div key={m.id} className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
                  <p className="font-medium text-foreground">{m.nombre}</p>
                  {m.titular && <p className="text-muted-foreground">Titular: {m.titular}</p>}
                  {m.numeroCuenta && (
                    <p className="text-muted-foreground">
                      Cuenta: {m.numeroCuenta}
                      {m.tipoCuenta ? ` (${m.tipoCuenta})` : ''}
                    </p>
                  )}
                  {m.instrucciones && (
                    <p className="mt-1 text-xs text-muted-foreground">{m.instrucciones}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
              {companyName} aún no publicó cuentas para transferencia. Puedes pagar
              en la sucursal con la otra opción.
            </p>
          )}

          <ComprobanteForm
            membershipId={membershipId}
            metodosPago={transferencias.map((m) => ({ id: m.id, nombre: m.nombre }))}
          />
        </div>
      ) : avisado ? (
        <div className="rounded-2xl border border-success/25 bg-success/10 p-5">
          <p className="flex items-center gap-2 font-semibold text-success">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden /> Aviso enviado
          </p>
          <p className="mt-2 text-sm text-foreground">
            Te esperamos en {sucursal?.nombre || `la sucursal de ${companyName}`}.
            Cuando la persona encargada reciba tu pago, lo confirmará y tu plan se
            activará al instante.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Dirígete a {sucursal?.nombre || `la sucursal de ${companyName}`} para
              realizar tu pago
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              La persona encargada recibirá tu pago, lo confirmará y tu plan se
              activará al instante — sin subir ningún comprobante.
            </p>
            {sucursal?.instrucciones && (
              <p className="mt-2 text-xs text-muted-foreground">{sucursal.instrucciones}</p>
            )}
          </div>

          <form action={formAction}>
            <input type="hidden" name="membershipId" value={membershipId} />
            {sucursal && <input type="hidden" name="metodoPagoId" value={sucursal.id} />}
            <Button type="submit" disabled={pending} className="w-full py-6 text-base font-semibold">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pagaré en la sucursal
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Avisamos al equipo para que te espere; tu plan queda reservado mientras tanto.
          </p>
        </div>
      )}
    </div>
  )
}
