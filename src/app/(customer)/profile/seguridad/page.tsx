export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ChangePasswordForm } from '@/components/customers/ChangePasswordForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SeguridadPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Seguridad</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
