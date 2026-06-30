import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { SucursalForm } from '@/components/admin/SucursalForm'

export default async function EditarSucursalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(['ADMIN_EMPRESA', 'SUPERADMIN'])
  const { id } = await params

  const suc = await prisma.sucursal.findUnique({ where: { id } })
  if (!suc) return notFound()

  const companyId = companyFilter(user)
  if (companyId && suc.companyId !== companyId) return notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar sucursal</h1>
        <p className="text-sm text-muted-foreground">{suc.nombre}</p>
      </div>
      <SucursalForm
        existing={{
          id: suc.id,
          nombre: suc.nombre,
          direccion: suc.direccion,
          telefono: suc.telefono,
          activa: suc.activa,
        }}
      />
    </div>
  )
}
