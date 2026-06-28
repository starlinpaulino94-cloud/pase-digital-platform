export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { createCustomerAction } from '@/modules/clientes/actions'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActionResult } from '@/types/auth'
import type { Customer } from '@/modules/clientes/types'

export default async function NuevoClientePage() {
  const user = await requireRole('ADMIN_EMPRESA')
  if (!user.companyId) notFound()

  const companyId = user.companyId

  async function action(_prev: ActionResult<Customer>, formData: FormData) {
    'use server'
    const result = await createCustomerAction(companyId, _prev, formData)
    if (result.success && result.data) {
      redirect(`/dashboard/clientes/${result.data.id}`)
    }
    return result
  }

  return (
    <div className="p-6 max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/clientes">← Volver</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos del cliente</CardTitle></CardHeader>
        <CardContent>
          <CustomerForm action={action} isNew submitLabel="Crear cliente" />
        </CardContent>
      </Card>
    </div>
  )
}
