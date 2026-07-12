'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  crearPost,
  actualizarPost,
  type PostState,
} from '@/modules/admin/postActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ExistingPost {
  id: string
  tipo: string
  titulo: string
  contenido: string
  imagenUrl: string | null
  fechaEvento: Date | null
  lugar: string | null
  campanaId: string | null
  activo: boolean
}

interface CampanaOption {
  id: string
  nombre: string
}

const init: PostState = {}

function toDatetimeLocal(d: Date | null) {
  if (!d) return ''
  const date = new Date(d)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function PostForm({
  existing,
  campanas = [],
}: {
  existing?: ExistingPost
  campanas?: CampanaOption[]
}) {
  const router = useRouter()
  const action = existing ? actualizarPost : crearPost
  const [state, formAction, pending] = useActionState(action, init)
  const [tipo, setTipo] = useState(existing?.tipo ?? 'NOTICIA')

  useEffect(() => {
    if (state.success) {
      toast.success(existing ? 'Publicación actualizada.' : 'Publicación creada. Tus seguidores fueron notificados.')
      router.push('/admin/publicaciones')
      router.refresh()
    }
  }, [state.success, existing, router])

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      {existing && <input type="hidden" name="id" value={existing.id} />}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo *</Label>
        <Select name="tipo" value={tipo} onValueChange={setTipo}>
          <SelectTrigger id="tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NOTICIA">Noticia / novedad</SelectItem>
            <SelectItem value="EVENTO">Evento</SelectItem>
            <SelectItem value="BENEFICIO">Beneficio para miembros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          name="titulo"
          defaultValue={existing?.titulo}
          placeholder={
            tipo === 'EVENTO'
              ? 'Ej: Feria de aniversario'
              : tipo === 'BENEFICIO'
                ? 'Ej: Café gratis para miembros'
                : 'Ej: Nuevo horario extendido'
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contenido">Contenido *</Label>
        <Textarea
          id="contenido"
          name="contenido"
          defaultValue={existing?.contenido}
          rows={4}
          placeholder="Detalles para tus seguidores"
          required
        />
      </div>

      {tipo === 'EVENTO' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="fechaEvento">Fecha y hora del evento *</Label>
            <Input
              id="fechaEvento"
              name="fechaEvento"
              type="datetime-local"
              defaultValue={toDatetimeLocal(existing?.fechaEvento ?? null)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lugar">Lugar</Label>
            <Input
              id="lugar"
              name="lugar"
              defaultValue={existing?.lugar ?? ''}
              placeholder="Ej: Sucursal principal"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="imagenUrl">Imagen (URL)</Label>
        <Input
          id="imagenUrl"
          name="imagenUrl"
          defaultValue={existing?.imagenUrl ?? ''}
          placeholder="https://..."
        />
      </div>

      {campanas.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="campanaId">Campaña (opcional)</Label>
          <Select name="campanaId" defaultValue={existing?.campanaId ?? 'none'}>
            <SelectTrigger id="campanaId">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin campaña</SelectItem>
              {campanas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {existing && (
        <div className="flex items-center gap-3">
          <Switch
            id="activo"
            name="activo"
            defaultChecked={existing.activo}
            value="true"
            onCheckedChange={(checked) => {
              const el = document.querySelector<HTMLInputElement>('input[name="activo"]')
              if (el) el.value = String(checked)
            }}
          />
          <Label htmlFor="activo">Visible en el perfil público</Label>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existing ? 'Guardar cambios' : 'Publicar'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
