export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId } from '@/modules/clientes/queries'
import { UpdateProfileForm } from '@/components/customers/UpdateProfileForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ConfiguracionPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId ? await getCustomerByUserId(session.dbUserId) : null
  if (!customer) redirect('/profile')

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información personal</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateProfileForm customer={customer} />
        </CardContent>
      </Card>
    </div>
  )
}
