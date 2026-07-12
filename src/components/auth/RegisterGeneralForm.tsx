'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  registrarCuentaGeneral,
  type RegistroState,
} from '@/modules/registro/actions'
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

/**
 * Registro general de MembeGo: crea la cuenta sin obligar a elegir empresa,
 * seguirla ni tener membresía. Tras el alta entra directo a la app
 * (auto-login) y aterriza en el explorador de empresas del portal.
 */
export function RegisterGeneralForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(registrarCuentaGeneral, initial)
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
        router.replace('/login?redirect=/cliente/explorar')
        return
      }
      setRedirecting(true)
      const supabase = createClient()
      supabase.auth
        .signInWithPassword({ email: creds.email, password: creds.password })
        .then(({ error }) => {
          if (error) {
            toast.success('Cuenta creada. Inicia sesión para continuar.')
            router.replace('/login?redirect=/cliente/explorar')
            return
          }
          toast.success('¡Bienvenido a MembeGo! Explora empresas y únete a las que quieras.')
          router.replace('/cliente/explorar')
          router.refresh()
        })
        .catch(() => {
          router.replace('/login?redirect=/cliente/explorar')
        })
    }
  }, [state.success, state.pendingVerification, router])

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Crear cuenta MembeGo</CardTitle>
        <CardDescription className="text-white/60">
          Una sola cuenta para todas las empresas. Sin compromiso: sigues o te
          unes a las que tú quieras, cuando quieras.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} onSubmit={captureCreds} className="space-y-4">
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
          >
            {(pending || redirecting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {redirecting ? 'Entrando…' : 'Crear cuenta'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-white/60">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-primary hover:underline">
            Inicia sesión
          </a>
        </p>
        <p className="mt-2 text-center text-sm text-white/60">
          ¿Prefieres registrarte directo en una empresa?{' '}
          <Link href="/registro" className="text-primary hover:underline">
            Elige una aquí
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
