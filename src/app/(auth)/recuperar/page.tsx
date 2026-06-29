'use client'

import { useState } from 'react'
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

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : undefined

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo }
    )

    setLoading(false)

    if (resetError) {
      setError('No pudimos enviar el correo. Intenta de nuevo más tarde.')
      return
    }

    setSuccess(true)
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
        <CardDescription className="text-slate-400">
          Te enviaremos un enlace para restablecer tu contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Si existe una cuenta con ese correo, te enviamos un enlace para
                restablecer tu contraseña. Revisa tu bandeja de entrada.
              </AlertDescription>
            </Alert>
            <p className="text-center text-sm text-slate-400">
              <a href="/login" className="text-sky-400 hover:underline">
                Volver a iniciar sesión
              </a>
            </p>
          </div>
        ) : (
          <>
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
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-400"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar enlace
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">
              <a href="/login" className="text-sky-400 hover:underline">
                Volver a iniciar sesión
              </a>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
