export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId, getActivePass } from '@/modules/clientes/queries'
import { DigitalPassQR } from '@/components/customers/DigitalPassQR'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function PaseDigitalPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId
    ? await getCustomerByUserId(session.dbUserId)
    : null

  if (!customer) redirect('/profile')

  const pass = await getActivePass(customer.id)

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">← Mi perfil</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Mi Pase Digital</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Código QR</CardTitle>
        </CardHeader>
        <CardContent>
          {pass ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <DigitalPassQR token={pass.token} size={260} />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{customer.firstName} {customer.lastName}</p>
                <Badge variant={pass.isActive ? 'default' : 'destructive'}>
                  {pass.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Muestra este código al empleado para validar tus beneficios.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-muted-foreground">No tienes un Pase Digital activo.</p>
              <p className="text-sm text-muted-foreground">
                Contacta con la empresa para obtener tu pase.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
