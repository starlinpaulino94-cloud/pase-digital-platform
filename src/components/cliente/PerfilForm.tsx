'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  actualizarPerfil,
  type ClienteActionState,
} from '@/modules/cliente/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const initial: ClienteActionState = {}

export function PerfilForm({
  nombre,
  telefono,
  email,
}: {
  nombre: string
  telefono: string
  email: string
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(actualizarPerfil, initial)

  useEffect(() => {
    if (state.success) {
      toast.success('Perfil actualizado.')
      router.refresh()
    }
  }, [state.success, router])

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" type="email" value={email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" defaultValue={nombre} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          defaultValue={telefono}
          placeholder="809-000-0000"
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-sky-500 hover:bg-sky-400 text-white"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  )
}
