'use client'

import { eliminarPromocion } from '@/modules/admin/promocionActions'
import { DeleteButton } from '@/components/ui/delete-button'

export function DeletePromocionButton({
  id,
  titulo,
}: {
  id: string
  titulo: string
}) {
  return (
    <DeleteButton
      action={async () => {
        const fd = new FormData()
        fd.set('id', id)
        return eliminarPromocion({}, fd)
      }}
      title={`¿Eliminar la promoción "${titulo}"?`}
      label="Eliminar promoción"
      successMessage={`"${titulo}" eliminada.`}
    />
  )
}
