'use client'

import { eliminarMetodoPago } from '@/modules/admin/metodoPagoActions'
import { DeleteButton } from '@/components/ui/delete-button'

export function DeleteMetodoPagoButton({
  id,
  nombre,
}: {
  id: string
  nombre: string
}) {
  return (
    <DeleteButton
      action={async () => {
        const fd = new FormData()
        fd.set('id', id)
        return eliminarMetodoPago({}, fd)
      }}
      title={`¿Eliminar el método "${nombre}"?`}
      description="Si tiene membresías asociadas se desactivará en lugar de eliminarse."
      successMessage={`"${nombre}" eliminado.`}
      label={`Eliminar método de pago ${nombre}`}
    />
  )
}
