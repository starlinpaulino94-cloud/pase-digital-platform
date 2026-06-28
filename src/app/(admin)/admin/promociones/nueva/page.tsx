export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { listAllCompanies } from '@/modules/empresas/queries'
import { PromotionForm } from '@/components/promotions/PromotionForm'
import { createPromotionAction } from '@/modules/promociones/actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NuevaPromocionAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>
}) {
  await requireSuperAdmin()
  const { companyId } = await searchParams

  const { items: companies } = await listAllCompanies({ status: 'ACTIVE' })

  if (!companyId) {
    return (
      <div className="p-6 max-w-lg space-y-6">
        <h1 className="text-2xl font-semibold">Nueva Promoción</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seleccionar empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyId">Empresa *</Label>
                <Select name="companyId">
                  <SelectTrigger id="companyId">
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                Continuar
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const company = companies.find((c) => c.id === companyId)
  if (!company) redirect('/admin/promociones/nueva')

  const boundAction = createPromotionAction.bind(null, companyId)

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nueva Promoción</h1>
        <p className="text-sm text-muted-foreground">Empresa: {company.name}</p>
      </div>
      <PromotionForm action={boundAction} isNew submitLabel="Crear promoción" />
    </div>
  )
}
