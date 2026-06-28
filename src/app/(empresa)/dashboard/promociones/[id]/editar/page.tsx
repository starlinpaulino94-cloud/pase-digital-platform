export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { getPromotionById, promotionBelongsToCompany } from '@/modules/promociones/queries'
import { updatePromotionAction } from '@/modules/promociones/actions'
import { PromotionForm } from '@/components/promotions/PromotionForm'
import { Button } from '@/components/ui/button'

export default async function EditarPromocionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')
  const { id } = await params

  const promotion = await getPromotionById(id)
  if (!promotion) notFound()

  if (user.role !== 'SUPERADMIN') {
    const owned = await promotionBelongsToCompany(id, user.companyId!)
    if (!owned) notFound()
  }

  if (promotion.status === 'CANCELLED') {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Editar Promoción</h1>
        <p className="text-sm text-destructive">Las promociones archivadas no se pueden editar.</p>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/promociones/${id}`}>← Volver</Link>
        </Button>
      </div>
    )
  }

  const boundAction = updatePromotionAction.bind(null, id)

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/promociones/${id}`}>←</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Editar Promoción</h1>
          <p className="text-sm text-muted-foreground">{promotion.name}</p>
        </div>
      </div>
      <PromotionForm
        action={boundAction}
        defaultValues={promotion}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
