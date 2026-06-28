export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId } from '@/modules/clientes/queries'
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId
    ? await getCustomerByUserId(session.dbUserId)
    : null

  if (!customer) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">Perfil de cliente no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.firstName} {customer.lastName}</h1>
          <p className="text-sm text-muted-foreground">{customer.user.email}</p>
        </div>
        <CustomerStatusBadge status={customer.status} />
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Información</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Email" value={customer.user.email} />
            <Row label="Teléfono" value={customer.phone} />
            <Row label="Miembro desde" value={customer.createdAt.toLocaleDateString('es-DO')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pase Digital</CardTitle>
              <Button asChild size="sm">
                <Link href="/profile/pase">Ver Pase</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tu código QR único para acceder a beneficios y promociones.
            </p>
          </CardContent>
        </Card>

        {(customer.customerCompanies ?? []).length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Mis empresas</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {customer.customerCompanies!.map((cc) => (
                  <Badge key={cc.id} variant="outline">
                    {cc.company?.name}
                    {cc.totalVisits > 0 && (
                      <span className="ml-1 text-xs">· {cc.totalVisits} visitas</span>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  )
}
