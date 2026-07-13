'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarCampana } from '@/modules/invitaciones/adminActions'
import { Button } from '@/components/ui/button'

/**
 * Eliminar con confirmación en dos pasos: el primer clic arma el botón
 * (texto "¿Seguro?"), el segundo ejecuta. Se desarma solo a los 3 segundos.
 */
export function CampanaEliminarButton({ id }: { id: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    if (!confirmando) {
      setConfirmando(true)
      setTimeout(() => setConfirmando(false), 3000)
      return
    }
    startTransition(async () => {
      const res = await eliminarCampana(id)
      if (res.error) {
        toast.error(res.error)
        setConfirmando(false)
      } else {
        toast.success('Campaña eliminada.')
        router.push('/admin/invitaciones')
        router.refresh()
      }
    })
  }

  return (
    <Button
      variant={confirmando ? 'destructive' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="gap-1"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      {confirmando ? '¿Seguro?' : 'Eliminar'}
    </Button>
  )
}
