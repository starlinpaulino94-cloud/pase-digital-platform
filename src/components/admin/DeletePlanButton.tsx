'use client'

import { useActionState } from 'react'
import { eliminarPlan } from '@/modules/admin/planActions'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function DeletePlanButton({ planId, memberships }: { planId: string; memberships: number }) {
  const [state, action, pending] = useActionState(eliminarPlan, {})

  if (memberships > 0) {
    return (
      <Button size="sm" variant="outline" disabled title={`${memberships} membresía(s) asociadas`}>
        <Trash2 className="h-3.5 w-3.5 text-slate-300" />
      </Button>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="planId" value={planId} />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <Button
        size="sm"
        variant="outline"
        type="submit"
        disabled={pending}
        className="border-red-200 text-red-600 hover:bg-red-50"
        onClick={(e) => {
          if (!confirm('¿Eliminar este plan? Esta acción no se puede deshacer.')) e.preventDefault()
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </form>
  )
}
