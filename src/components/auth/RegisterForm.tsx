'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
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
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { isGoogleAuthEnabled } from '@/lib/auth/googleAuth'

const initial: RegistroState = {}

export function RegisterForm({
  companySlug,
  companyName,
  isCarwash,
  colorPrimario = null,
}: {
  companySlug: string
  companyName: string
  isCarwash: boolean
  colorPrimario?: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') ?? ''
  const [state, formAction, pending] = useActionState(registrarCliente, initial)
  // Al enviar guardamos las credenciales para iniciar sesión automáticamente
  // en cuanto el registro se complete (sin volver a la pantalla de login).
  const credsRef = useRef<{ email: string; password: string } | null>(null)
  const handledRef = useRef(false)
  const [redirecting, setRedirecting] = useState(false)

  function captureCreds(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget)
    credsRef.current = {
      email: String(fd.get('email') ?? '').trim().toLowerCase(),
      password: String(fd.get('password') ?? ''),
    }
  }

  useEffect(() => {
    if (handledRef.current) return

    // Cuenta pendiente de confirmar el correo: no se puede autenticar todavía.
    if (state.pendingVerification) {
      handledRef.current = true
      toast.success(
        'Te enviamos un enlace de confirmación a tu correo. Ábrelo para activar tu cuenta.'
      )
      router.replace('/login?verifica=1')
      return
    }

    if (state.success) {
      handledRef.current = true
      const creds = credsRef.current
      if (!creds) {
        router.replace('/login?redirect=/cliente/membresia')
        return
      }
      // Auto-login: crea la sesión en el navegador y entra directo a la plataforma.
      setRedirecting(true)
      const supabase = createClient()
      supabase.auth
        .signInWithPassword({ email: creds.email, password: creds.password })
        .then(({ error }) => {
          if (error) {
            // Si por cualquier motivo no se pudo iniciar sesión, caemos al login.
            toast.success('Cuenta creada. Inicia sesión para continuar.')
            router.replace('/login?redirect=/cliente/membresia')
            return
          }
          toast.success('¡Bienvenido! Tu cuenta está lista.')
          router.replace('/cliente/membresia')
          router.refresh()
        })
        .catch(() => {
          router.replace('/login?redirect=/cliente/membresia')
        })
    }
  }, [state.success, state.pendingVerification, router])

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription className="text-white/60">
            Regístrate en {companyName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} onSubmit={captureCreds} className="space-y-4">
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
                className="bg-white/10 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="bg-white/10 text-white placeholder:text-white/50"
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
                className="bg-white/10 text-white placeholder:text-white/50"
                placeholder="809-555-0000"
              />
            </div>

            {isCarwash && (
              <div className="space-y-4 rounded-lg border border-white/10 p-4">
                <p className="text-sm font-medium text-white/70">
                  Tu vehículo (opcional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca</Label>
                    <Input id="marca" name="marca" className="bg-white/10 text-white placeholder:text-white/50" placeholder="Toyota" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input id="modelo" name="modelo" className="bg-white/10 text-white placeholder:text-white/50" placeholder="Corolla" />
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
                    <Input id="color" name="color" className="bg-white/10 text-white placeholder:text-white/50" placeholder="Blanco" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="placa">Placa</Label>
                    <Input id="placa" name="placa" className="bg-white/10 text-white placeholder:text-white/50" placeholder="A123456" />
                  </div>
                </div>
              </div>
            )}

            {/* F5.2: auto-seguir con opción de desmarcar (el hidden va primero;
                si el checkbox está marcado, su valor "on" queda al final). */}
            <label className="flex items-start gap-2 text-sm text-white/70">
              <input type="hidden" name="seguirEmpresa" value="off" />
              <input
                type="checkbox"
                name="seguirEmpresa"
                value="on"
                defaultChecked
                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10"
              />
              <span>
                Seguir a {companyName} para recibir sus promociones y novedades.
              </span>
            </label>

            {/* Aceptación de términos (obligatoria) — se persiste con versión. */}
            <label className="flex items-start gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                name="terminos"
                value="on"
                required
                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10"
              />
              <span>
                Acepto los{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  política de privacidad
                </a>
                .
              </span>
            </label>

            {/* Consentimiento de marketing (opcional). El hidden "off" va
                primero; si se marca, "on" queda al final. */}
            <label className="flex items-start gap-2 text-sm text-white/70">
              <input type="hidden" name="marketingConsent" value="off" />
              <input
                type="checkbox"
                name="marketingConsent"
                value="on"
                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10"
              />
              <span>
                Quiero recibir novedades y ofertas de MembeGo por correo (opcional).
              </span>
            </label>

            <Button
              type="submit"
              disabled={pending || redirecting}
              className="w-full bg-primary hover:bg-primary/90"
              style={colorPrimario ? { backgroundColor: colorPrimario } : undefined}
            >
              {(pending || redirecting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {redirecting ? 'Entrando…' : 'Crear cuenta'}
            </Button>
          </form>
          {isGoogleAuthEnabled() && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-xs text-white/50">
                <span className="h-px flex-1 bg-white/10" />
                o
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <GoogleSignInButton companySlug={companySlug} refCode={refCode || null} />
              <p className="text-center text-xs text-white/50">
                Al continuar con Google aceptas los{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  términos
                </a>{' '}
                y la{' '}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  política de privacidad
                </a>
                .
              </p>
            </div>
          )}
          <p className="mt-4 text-center text-sm text-white/60">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-primary hover:underline">
              Inicia sesión
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
