export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId } from '@/modules/clientes/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function MisEmpresasPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId ? await getCustomerByUserId(session.dbUserId) : null
  if (!customer) redirect('/profile')

  const links = customer.customerCompanies ?? []

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Mis Empresas</h1>

      {links.length === 0 ? (
        <p className="text-muted-foreground">No estás vinculado a ninguna empresa.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {links.map((cc) => (
            <Card key={cc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{cc.company?.name ?? ''}</CardTitle>
                  <Badge variant="outline" className="text-xs">{cc.company?.industry}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Visitas: {cc.totalVisits}</p>
                {cc.firstVisitAt && (
                  <p>Primera visita: {new Date(cc.firstVisitAt).toLocaleDateString('es-DO')}</p>
                )}
                {cc.lastVisitAt && (
                  <p>Última visita: {new Date(cc.lastVisitAt).toLocaleDateString('es-DO')}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
