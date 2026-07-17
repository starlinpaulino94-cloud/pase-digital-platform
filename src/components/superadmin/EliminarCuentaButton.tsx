'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  eliminarClienteGlobal,
  eliminarUsuarioGlobal,
  type EliminarState,
} from '@/modules/superadmin/eliminarActions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const init: EliminarState = {}

/**
 * Botón de eliminación definitiva (solo SUPERADMIN). Exige escribir ELIMINAR
 * para habilitar la acción; al terminar redirige a la lista correspondiente.
 */
export function EliminarCuentaButton({
  tipo,
  id,
  nombre,
  redirectTo,
  detalle,
}: {
  tipo: 'cliente' | 'usuario'
  id: string
  nombre: string
  /** A dónde volver tras eliminar (la ficha actual deja de existir). */
  redirectTo: string
  /** Aclaración extra bajo la advertencia (opcional). */
  detalle?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmacion, setConfirmacion] = useState('')
  const action = tipo === 'cliente' ? eliminarClienteGlobal : eliminarUsuarioGlobal
  const [state, formAction, pending] = useActionState(action, init)

  useEffect(() => {
    if (state.success) {
      toast.success(state.mensaje ?? 'Cuenta eliminada.')
      router.push(redirectTo)
      router.refresh()
    }
    if (state.error) toast.error(state.error)
  }, [state, router, redirectTo])

  const habilitado = confirmacion.trim().toUpperCase() === 'ELIMINAR'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Eliminar {tipo}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar {tipo === 'cliente' ? 'cliente' : 'usuario'}
          </DialogTitle>
          <DialogDescription>
            Vas a eliminar de forma <span className="font-semibold">definitiva</span> a{' '}
            <span className="font-semibold text-foreground">{nombre}</span>
            {tipo === 'cliente'
              ? ': sus membresías, QR, visitas, vehículos y datos personales. Las facturas y transacciones de la empresa se conservan (sin el cliente asociado).'
              : ' y su acceso a la plataforma.'}{' '}
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name={tipo === 'cliente' ? 'clienteId' : 'userId'} value={id} />
          <label className="block text-sm font-medium text-foreground">
            Escribe <span className="font-mono font-bold">ELIMINAR</span> para confirmar
            <input
              name="confirmacion"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            />
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!habilitado || pending}
              className="flex-1 gap-2"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Eliminar definitivamente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
