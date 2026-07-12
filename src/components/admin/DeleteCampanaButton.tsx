'use client'

import { eliminarCampana } from '@/modules/admin/campanaActions'
import { DeleteButton } from '@/components/ui/delete-button'

export function DeleteCampanaButton({ id, nombre }: { id: string; nombre: string }) {
  return (
    <DeleteButton
      action={async () => {
        const fd = new FormData()
        fd.set('id', id)
        return eliminarCampana({}, fd)
      }}
      title={`¿Eliminar la campaña "${nombre}"?`}
      description="Sus promociones y publicaciones quedarán sin campaña (no se borran)."
      label="Eliminar campaña"
      successMessage={`"${nombre}" eliminada.`}
    />
  )
}
