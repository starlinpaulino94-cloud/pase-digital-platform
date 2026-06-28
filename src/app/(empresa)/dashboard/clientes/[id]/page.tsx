export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { getCustomerById, getActivePass, customerLinkedToCompany } from '@/modules/clientes/queries'
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge'
import { DigitalPassQR } from '@/components/customers/DigitalPassQR'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClienteDetailPage({ params }: Props) {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')
  const { id } = await params

  const customer = await getCustomerById(id)
  if (!customer) notFound()

  // Non-superadmin: verify customer belongs to their company
  if (user.role !== 'SUPERADMIN') {
    const linked = await customerLinkedToCompany(id, user.companyId!)
    if (!linked) notFound()
  }

  const pass = await getActivePass(id)
  const canEdit = user.role === 'ADMIN_EMPRESA' || user.role === 'SUPERADMIN'

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/clientes">← Volver</Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{customer.firstName} {customer.lastName}</h1>
            <CustomerStatusBadge status={customer.status} />
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/clientes/${id}/editar`}>Editar</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Información</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Email" value={customer.user.email} />
            <Row label="Teléfono" value={customer.phone} />
            <Row label="Registrado" value={customer.createdAt.toLocaleDateString('es-DO')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pase Digital</CardTitle></CardHeader>
          <CardContent>
            {pass ? (
              <div className="flex justify-center">
                <DigitalPassQR token={pass.token} size={180} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin Pase Digital activo.</p>
            )}
          </CardContent>
        </Card>
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
