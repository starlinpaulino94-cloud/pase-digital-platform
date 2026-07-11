import { notFound } from 'next/navigation'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { PromocionForm } from '@/components/admin/PromocionForm'

export default async function EditarPromocionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(ADMIN_ROLES)
  const { id } = await params

  const promo = await prisma.promocion.findUnique({ where: { id } })
  if (!promo) notFound()

  const campanas = await prisma.campana.findMany({
    where: { companyId: promo.companyId, activo: true },
    select: { id: true, nombre: true },
    orderBy: { createdAt: 'desc' },
  })
  if (
    user.metadata.role !== 'SUPERADMIN' &&
    promo.companyId !== user.metadata.companyId
  ) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar promoción</h1>
      </div>
      <PromocionForm
        existing={{ ...promo, precio: promo.precio != null ? Number(promo.precio) : null }}
        campanas={campanas}
      />
    </div>
  )
}
