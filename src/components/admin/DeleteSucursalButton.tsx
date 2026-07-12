'use client'

import { eliminarSucursal } from '@/modules/admin/sucursalActions'
import { DeleteButton } from '@/components/ui/delete-button'

export function DeleteSucursalButton({ id, nombre }: { id: string; nombre: string }) {
  return (
    <DeleteButton
      action={async () => {
        const fd = new FormData()
        fd.set('id', id)
        return eliminarSucursal({}, fd)
      }}
      title={`¿Eliminar la sucursal "${nombre}"?`}
      description="Si tiene visitas registradas se desactivará en lugar de eliminarse."
      successMessage={`"${nombre}" eliminada.`}
      label={`Eliminar sucursal ${nombre}`}
    />
  )
}
