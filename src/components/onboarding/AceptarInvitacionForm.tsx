'use client'

import { useActionState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { aceptarInvitacion, type InvitacionState } from '@/modules/admin/invitacionActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const init: InvitacionState = {}

export function AceptarInvitacionForm({
  token,
  email,
  empresa,
  rol,
}: {
  token: string
  email: string
  empresa: string
  rol: string
}) {
  const [state, action, pending] = useActionState(aceptarInvitacion, init)

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h1 className="text-xl font-bold text-foreground">Únete a {empresa}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Te invitaron como <strong>{rol}</strong>. Crea tu cuenta para empezar.
      </p>

      <form action={action} className="mt-6 space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <input type="hidden" name="token" value={token} />

        <div className="space-y-2">
          <Label>Correo</Label>
          <Input value={email} disabled readOnly />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nombre">Tu nombre</Label>
          <Input id="nombre" name="nombre" required placeholder="Nombre y apellido" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="terminos" value="on" required className="mt-0.5 h-4 w-4 rounded border-border" />
          <span>
            Acepto los{' '}
            <a href="/terms" target="_blank" className="text-primary underline">términos</a>{' '}
            y la{' '}
            <a href="/privacy" target="_blank" className="text-primary underline">política de privacidad</a>.
          </span>
        </label>

        <Button type="submit" disabled={pending} className="w-full">
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cuenta y unirme
        </Button>
      </form>
    </div>
  )
}
