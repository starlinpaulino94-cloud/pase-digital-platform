'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarPerfil, type ProfileState } from '@/modules/cliente/profileActions'
import { AvatarUpload } from '@/components/cliente/AvatarUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  clienteId: string
  nombre: string
  email: string
  telefono: string | null
  avatarUrl: string | null
}

const init: ProfileState = {}

export function ProfileForm({ clienteId, nombre, email, telefono, avatarUrl }: Props) {
  const [state, formAction, pending] = useActionState(actualizarPerfil, init)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (state.success) toast.success('Perfil actualizado correctamente.')
    if (state.error) toast.error(state.error)
  }, [state.success, state.error])

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="avatarUrl"
        value={uploadedAvatarUrl ?? avatarUrl ?? ''}
      />

      {/* Avatar */}
      <div className="flex justify-center">
        <AvatarUpload
          clienteId={clienteId}
          currentUrl={avatarUrl}
          nombre={nombre}
          onUploaded={setUploadedAvatarUrl}
        />
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Perfil actualizado correctamente.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre completo *</Label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={nombre}
            placeholder="Tu nombre"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            name="telefono"
            defaultValue={telefono ?? ''}
            placeholder="809-555-0000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Correo electrónico</Label>
        <Input value={email} disabled className="bg-muted/40 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          El correo no se puede modificar desde aquí.
        </p>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-sky-500 hover:bg-sky-400"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  )
}
