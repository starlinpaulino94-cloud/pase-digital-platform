export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { getCustomerById, customerLinkedToCompany } from '@/modules/clientes/queries'
import { updateCustomerAction } from '@/modules/clientes/actions'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActionResult } from '@/types/auth'
import type { Customer } from '@/modules/clientes/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarClientePage({ params }: Props) {
  const user = await requireRole('ADMIN_EMPRESA')
  const { id } = await params

  const customer = await getCustomerById(id)
  if (!customer) notFound()

  const linked = await customerLinkedToCompany(id, user.companyId!)
  if (!linked) notFound()

  async function action(_prev: ActionResult<Customer>, formData: FormData) {
    'use server'
    const result = await updateCustomerAction(id, _prev, formData)
    if (result.success) redirect(`/dashboard/clientes/${id}`)
    return result
  }

  return (
    <div className="p-6 max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/clientes/${id}`}>← Volver</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Editar: {customer.firstName} {customer.lastName}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos del cliente</CardTitle></CardHeader>
        <CardContent>
          <CustomerForm action={action} defaultValues={customer} submitLabel="Guardar cambios" />
        </CardContent>
      </Card>
    </div>
  )
}
