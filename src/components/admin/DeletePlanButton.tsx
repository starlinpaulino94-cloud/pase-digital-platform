'use client'

import { eliminarPlan } from '@/modules/admin/planActions'
import { DeleteButton } from '@/components/ui/delete-button'

export function DeletePlanButton({ planId, memberships }: { planId: string; memberships: number }) {
  return (
    <DeleteButton
      action={async () => {
        const fd = new FormData()
        fd.set('planId', planId)
        return eliminarPlan({}, fd)
      }}
      title="¿Eliminar este plan?"
      description="Esta acción no se puede deshacer."
      successMessage="Plan eliminado."
      label="Eliminar plan"
      disabled={memberships > 0}
      disabledReason={`${memberships} membresía(s) asociadas`}
    />
  )
}
