'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { crearTicket, type ActionState } from '@/modules/soporte/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TICKET_CATEGORIAS, categoriaLabel } from '@/lib/soporte'

const init: ActionState = {}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Enviar reporte
    </Button>
  )
}

export function ReportarProblemaForm() {
  const [state, action] = useActionState(crearTicket, init)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? 'Reporte enviado.')
      formRef.current?.reset()
    }
    if (state.error) toast.error(state.error)
  }, [state.success, state.error, state.message])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="asunto">Asunto</Label>
        <Input id="asunto" name="asunto" placeholder="Resumen breve del problema" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoria">Categoría</Label>
        <Select name="categoria" defaultValue="OTRO">
          <SelectTrigger id="categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKET_CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>
                {categoriaLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          placeholder="Cuéntanos qué ocurrió con el mayor detalle posible…"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="adjuntoUrl">Adjuntar captura (opcional)</Label>
        <Input
          id="adjuntoUrl"
          name="adjuntoUrl"
          type="url"
          placeholder="Enlace a una imagen (https://…)"
        />
        <p className="text-xs text-muted-foreground">
          Pega el enlace de una captura si lo tienes. La subida directa de archivos se
          habilitará próximamente.
        </p>
      </div>

      <SubmitBtn />
    </form>
  )
}
