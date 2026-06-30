'use client'

import { useActionState, useState } from 'react'
import { Loader2, Upload, Building2, Store, Check } from 'lucide-react'
import { registrarPago, type PagoState } from '@/modules/pagos/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const initial: PagoState = {}

export function PagoForm({
  planId,
  planNombre,
  planPrecio,
  bankAccounts,
}: {
  planId: string
  planNombre: string
  planPrecio: number
  bankAccounts: {
    id: string
    banco: string
    titular: string
    numero: string
    tipoCuenta: string
    instrucciones: string | null
  }[]
}) {
  const [state, formAction, pending] = useActionState(registrarPago, initial)
  const [metodo, setMetodo] = useState<'TRANSFERENCIA' | 'PRESENCIAL'>('TRANSFERENCIA')
  const [fileName, setFileName] = useState<string | null>(null)

  if (state.success) {
    return (
      <Card className="border-green-200">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Pago registrado</h2>
          <p className="mt-2 max-w-sm text-slate-600">
            {metodo === 'TRANSFERENCIA'
              ? 'Tu comprobante fue enviado. El equipo validará tu pago y activará tu Pase Digital en breve.'
              : 'Tu solicitud quedó registrada. Acude a la sucursal para completar el pago y activar tu Pase Digital.'}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Estado: <strong className="text-amber-600">Pendiente de validación</strong>
          </p>
          <Button
            className="mt-6 bg-sky-500 hover:bg-sky-400"
            onClick={() => (window.location.href = '/cliente/dashboard')}
          >
            Ir a mi panel
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="metodo" value={metodo} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Selector de método */}
      <div>
        <Label className="mb-3 block">Método de pago</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMetodo('TRANSFERENCIA')}
            className={cn(
              'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition',
              metodo === 'TRANSFERENCIA'
                ? 'border-sky-500 bg-sky-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
            <div>
              <p className="font-semibold">Transferencia bancaria</p>
              <p className="text-xs text-slate-500">
                Transfiere y sube el comprobante
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMetodo('PRESENCIAL')}
            className={cn(
              'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition',
              metodo === 'PRESENCIAL'
                ? 'border-sky-500 bg-sky-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-semibold">Pagar en sucursal</p>
              <p className="text-xs text-slate-500">
                Acude y paga en persona
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Transferencia: mostrar cuentas + subir comprobante */}
      {metodo === 'TRANSFERENCIA' && (
        <div className="space-y-4">
          {bankAccounts.length > 0 ? (
            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-sm">Datos para la transferencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bankAccounts.map((acc) => (
                  <div key={acc.id} className="rounded-lg border bg-white p-3 text-sm">
                    <p className="font-semibold">{acc.banco}</p>
                    <p>Titular: {acc.titular}</p>
                    <p>Cuenta: {acc.numero} ({acc.tipoCuenta})</p>
                    {acc.instrucciones && (
                      <p className="mt-2 text-xs text-slate-500">
                        {acc.instrucciones}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>
                Contacta al establecimiento para obtener los datos bancarios.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="comprobante">Comprobante de transferencia</Label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="comprobante"
                className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-3 text-sm text-slate-500 hover:border-sky-400 hover:bg-sky-50"
              >
                <Upload className="h-4 w-4" />
                {fileName ? fileName : 'Seleccionar archivo...'}
                <input
                  id="comprobante"
                  name="comprobante"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) =>
                    setFileName(e.target.files?.[0]?.name ?? null)
                  }
                />
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Sube una foto o PDF del comprobante (opcional si ingresas la referencia).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia de la transferencia (opcional)</Label>
            <Input
              id="referencia"
              name="referencia"
              placeholder="Número de transacción"
            />
          </div>
        </div>
      )}

      {/* Presencial: instrucciones */}
      {metodo === 'PRESENCIAL' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              Acude a cualquiera de nuestras sucursales para completar el pago.
              Menciona que tienes una solicitud pendiente para el plan{' '}
              <strong>{planNombre}</strong>. Una vez que pagues, nuestro personal
              activará tu Pase Digital inmediatamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resumen */}
      <Card className="bg-slate-50">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-slate-500">Total a pagar</p>
            <p className="text-2xl font-bold text-slate-900">
              RD${' '}
              {new Intl.NumberFormat('es-DO').format(planPrecio)}
            </p>
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="bg-sky-500 hover:bg-sky-400"
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {metodo === 'TRANSFERENCIA' ? 'Enviar comprobante' : 'Confirmar solicitud'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
