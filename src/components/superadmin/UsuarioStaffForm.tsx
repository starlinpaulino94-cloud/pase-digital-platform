'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  actualizarUsuarioStaff,
  type UsuarioStaffState,
} from '@/modules/superadmin/usuariosActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { INVITABLE_ROLES } from '@/types'

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  GERENTE: 'Gerente',
  CAJERO: 'Cajero',
  RECEPCION: 'Recepción',
  MARKETING: 'Marketing',
  SUPERVISOR: 'Supervisor',
  EMPLEADO: 'Empleado',
}

interface Company {
  id: string
  name: string
}

const init: UsuarioStaffState = {}

/**
 * Edición de un usuario de staff por el superadmin: datos, rol, empresas a
 * las que tiene acceso (multi-empresa) y contraseña opcional.
 */
export function UsuarioStaffForm({
  usuario,
  companies,
}: {
  usuario: {
    id: string
    name: string
    email: string
    role: string
    companyId: string | null
    accesoIds: string[]
  }
  companies: Company[]
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(actualizarUsuarioStaff, init)

  // Selección de empresas controlada: la empresa activa debe ser una de las
  // marcadas, así que el select de "activa" se recalcula al marcar/desmarcar.
  const inicial = new Set(
    usuario.accesoIds.length > 0
      ? usuario.accesoIds
      : usuario.companyId
        ? [usuario.companyId]
        : []
  )
  const [seleccion, setSeleccion] = useState<Set<string>>(inicial)
  const [activa, setActiva] = useState(usuario.companyId ?? '')

  useEffect(() => {
    if (state.success) {
      toast.success('Usuario actualizado.')
      router.push('/superadmin/usuarios')
      router.refresh()
    }
  }, [state.success, router])

  function toggleEmpresa(id: string, checked: boolean) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      // Si se desmarcó la activa, pasa a la primera disponible.
      if (!next.has(activa)) {
        setActiva(next.values().next().value ?? '')
      } else if (checked && !activa) {
        setActiva(id)
      }
      return next
    })
  }

  const seleccionadas = companies.filter((c) => seleccion.has(c.id))

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <input type="hidden" name="userId" value={usuario.id} />
      {[...seleccion].map((id) => (
        <input key={id} type="hidden" name="companyIds" value={id} />
      ))}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" name="nombre" defaultValue={usuario.name} required />
      </div>

      <div className="space-y-2">
        <Label>Correo</Label>
        <Input value={usuario.email} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">
          El correo es la identidad de acceso y no se cambia desde aquí.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol *</Label>
        <Select name="role" defaultValue={usuario.role} required>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecciona rol" />
          </SelectTrigger>
          <SelectContent>
            {INVITABLE_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROL_LABEL[r] ?? r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Empresas que puede administrar *</Label>
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-3">
          {companies.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={seleccion.has(c.id)}
                onChange={(e) => toggleEmpresa(c.id, e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              {c.name}
            </label>
          ))}
          {companies.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay empresas registradas.</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="empresaActiva">Empresa activa *</Label>
        <select
          id="empresaActiva"
          name="empresaActiva"
          value={activa}
          onChange={(e) => setActiva(e.target.value)}
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Seleccionar…</option>
          {seleccionadas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          La que verá al entrar al panel; puede cambiarla desde el selector si
          tiene varias.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña (opcional)</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={6}
          placeholder="Dejar en blanco para no cambiarla"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar cambios
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
