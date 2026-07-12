'use client'

import { eliminarPost } from '@/modules/admin/postActions'
import { DeleteButton } from '@/components/ui/delete-button'

export function DeletePostButton({
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
        return eliminarPost({}, fd)
      }}
      title={`¿Eliminar la publicación "${titulo}"?`}
      label="Eliminar publicación"
      successMessage={`"${titulo}" eliminada.`}
    />
  )
}
