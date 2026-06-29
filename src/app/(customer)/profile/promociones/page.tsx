export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId } from '@/modules/clientes/queries'
import { listCustomerAssignments } from '@/modules/asignaciones/queries'
import { AssignmentStatusBadge } from '@/components/assignments/AssignmentStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function MisPromocionesPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId ? await getCustomerByUserId(session.dbUserId) : null
  if (!customer) redirect('/profile')

  const assignments = await listCustomerAssignments(customer.id)

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Mis Promociones</h1>

      {assignments.length === 0 ? (
        <p className="text-muted-foreground">No tienes promociones asignadas.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{a.promotion?.name ?? ''}</CardTitle>
                  <AssignmentStatusBadge status={a.status} />
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Tipo: {a.promotion?.type ?? ''}</p>
                {a.usesAllowed !== null && (
                  <p>Usos: {a.usesConsumed} / {a.usesAllowed}</p>
                )}
                {a.expiresAt && (
                  <p>Vence: {new Date(a.expiresAt).toLocaleDateString('es-DO')}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
