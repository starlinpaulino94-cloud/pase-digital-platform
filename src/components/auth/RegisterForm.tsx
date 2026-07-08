'use client'

import { useActionState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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

const initial: RegistroState = {}

export function RegisterForm({
  companySlug,
  companyName,
  isCarwash,
}: {
  companySlug: string
  companyName: string
  isCarwash: boolean
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

            {/* F5.2: auto-seguir con opción de desmarcar (el hidden va primero;
                si el checkbox está marcado, su valor "on" queda al final). */}
            <label className="flex items-start gap-2 text-sm text-slate-300">
              <input type="hidden" name="seguirEmpresa" value="off" />
              <input
                type="checkbox"
                name="seguirEmpresa"
                value="on"
                defaultChecked
                className="mt-0.5 h-4 w-4 rounded border-slate-500"
              />
              <span>
                Seguir a {companyName} para recibir sus promociones y novedades.
              </span>
            </label>

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
