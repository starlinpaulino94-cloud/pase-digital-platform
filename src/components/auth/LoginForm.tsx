'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
import { ROLE_HOME, type AppRole } from '@/types'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      { email, password }
    )

    if (signInError) {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.')
      setLoading(false)
      return
    }

    const role = (data.user?.app_metadata?.role ?? 'CLIENTE') as AppRole
    const redirect = searchParams.get('redirect') ?? ROLE_HOME[role]
    router.replace(redirect)
    router.refresh()
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription className="text-slate-400">
          Accede a tu cuenta de PASE Digital.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 text-white"
              placeholder="tu@correo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 text-white"
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-400"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          <a href="/recuperar" className="text-sky-400 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </p>
        <p className="mt-2 text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <a href="/empresas" className="text-sky-400 hover:underline">
            Regístrate
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
