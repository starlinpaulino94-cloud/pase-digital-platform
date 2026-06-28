'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  publishPromotionAction,
  pausePromotionAction,
  archivePromotionAction,
  duplicatePromotionAction,
  deletePromotionAction,
} from '@/modules/promociones/actions'
import type { PromotionStatus } from '@/modules/promociones/types'

interface PromotionActionsProps {
  promotionId: string
  status: PromotionStatus
  redirectAfterDelete?: string
  redirectAfterDuplicate?: string
}

export function PromotionActions({
  promotionId,
  status,
  redirectAfterDelete,
  redirectAfterDuplicate,
}: PromotionActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handlePublish() {
    startTransition(async () => {
      const res = await publishPromotionAction(promotionId)
      if (res.success) router.refresh()
      else alert(res.error)
    })
  }

  function handlePause() {
    startTransition(async () => {
      const res = await pausePromotionAction(promotionId)
      if (res.success) router.refresh()
      else alert(res.error)
    })
  }

  function handleArchive() {
    startTransition(async () => {
      const res = await archivePromotionAction(promotionId)
      if (res.success) router.refresh()
      else alert(res.error)
    })
  }

  function handleDuplicate() {
    startTransition(async () => {
      const res = await duplicatePromotionAction(promotionId)
      if (res.success) {
        if (redirectAfterDuplicate) router.push(redirectAfterDuplicate)
        else router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deletePromotionAction(promotionId)
      if (res.success) {
        if (redirectAfterDelete) router.push(redirectAfterDelete)
        else router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(status === 'DRAFT' || status === 'PAUSED') && (
        <Button size="sm" onClick={handlePublish} disabled={isPending}>
          Publicar
        </Button>
      )}

      {status === 'ACTIVE' && (
        <Button size="sm" variant="outline" onClick={handlePause} disabled={isPending}>
          Pausar
        </Button>
      )}

      {status !== 'CANCELLED' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={isPending}>
              Archivar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Archivar promoción?</AlertDialogTitle>
              <AlertDialogDescription>
                La promoción quedará archivada. Las asignaciones existentes no se verán afectadas.
                Esta acción no se puede deshacer fácilmente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>Archivar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={isPending}>
        Duplicar
      </Button>

      {status === 'DRAFT' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={isPending}>
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
              <AlertDialogDescription>
                Solo se pueden eliminar promociones en estado Borrador sin asignaciones.
                Esta acción es permanente e irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar definitivamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
