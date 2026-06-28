export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/guards'
import { createPromotionAction } from '@/modules/promociones/actions'
import { PromotionForm } from '@/components/promotions/PromotionForm'

export default async function NuevaPromocionPage() {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA')
  const companyId = user.companyId!

  const boundAction = createPromotionAction.bind(null, companyId)

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Nueva Promoción</h1>
      <PromotionForm action={boundAction} isNew submitLabel="Crear promoción" />
    </div>
  )
}
