'use client'

import { useActionState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { registrarCliente, type RegistroState } from '@/modules/registro/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Plan {
  id: string
  nombre: string
  precio: number
  lavadosIncluidos: number
  esIlimitado: boolean
  descripcion: string | null
  beneficios: string[]
  vigenciaDias: number
}

const initial: RegistroState = {}

export function RegisterForm({
  companySlug,
  companyName,
  isCarwash,
  plans = [],
}: {
  companySlug: string
  companyName: string
  isCarwash: boolean
  plans?: Plan[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') ?? ''
  const [state, formAction, pending] = useActionState(registrarCliente, initial)

  useEffect(() => {
    if (state.success) {
      toast.success('Cuenta creada. Inicia sesión para continuar.')
      router.replace('/login?redirect=/cliente/membresia')
    }
  }, [state.success, router])

  return (
    <div className="space-y-6">
      {/* Plans preview */}
      {plans.length > 0 && (
        <div className="space-y-3">
          <p className="text-center text-sm font-medium text-slate-300">
            Planes disponibles en {companyName}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-white">{plan.nombre}</p>
                  <p className="shrink-0 text-lg font-bold text-sky-400">
                    ${plan.precio.toFixed(2)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {plan.esIlimitado
                    ? 'Usos ilimitados'
                    : `${plan.lavadosIncluidos} uso${plan.lavadosIncluidos !== 1 ? 's' : ''}`}{' '}
                  · {plan.vigenciaDias} días
                </p>
                {plan.beneficios.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {plan.beneficios.map((b) => (
                      <li key={b} className="flex items-center gap-1.5 text-xs text-slate-300">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-sky-400" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500">
            Seleccionarás tu plan después de registrarte.
          </p>
        </div>
      )}

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription className="text-slate-400">
            Regístrate en {companyName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="companySlug" value={companySlug} />
            {refCode && <input type="hidden" name="refCode" value={refCode} />}
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                name="nombre"
                required
                className="bg-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="bg-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="bg-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                className="bg-white/10 text-white placeholder:text-slate-500"
                placeholder="809-555-0000"
              />
            </div>

            {isCarwash && (
              <div className="space-y-4 rounded-lg border border-white/10 p-4">
                <p className="text-sm font-medium text-slate-300">
                  Tu vehículo (opcional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca</Label>
                    <Input id="marca" name="marca" className="bg-white/10 text-white placeholder:text-slate-500" placeholder="Toyota" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input id="modelo" name="modelo" className="bg-white/10 text-white placeholder:text-slate-500" placeholder="Corolla" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anio">Año</Label>
                    <Input
                      id="anio"
                      name="anio"
                      type="number"
                      className="bg-white/10 text-white"
                      placeholder={String(new Date().getFullYear())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" name="color" className="bg-white/10 text-white placeholder:text-slate-500" placeholder="Blanco" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="placa">Placa</Label>
                    <Input id="placa" name="placa" className="bg-white/10 text-white placeholder:text-slate-500" placeholder="A123456" />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-sky-500 hover:bg-sky-400"
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear cuenta
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-sky-400 hover:underline">
              Inicia sesión
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
