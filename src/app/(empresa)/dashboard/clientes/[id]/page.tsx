export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { getCustomerById, getActivePass, customerLinkedToCompany } from '@/modules/clientes/queries'
import { listCustomerAssignments } from '@/modules/asignaciones/queries'
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge'
import { AssignmentStatusBadge } from '@/components/assignments/AssignmentStatusBadge'
import { DigitalPassQR } from '@/components/customers/DigitalPassQR'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

  const [pass, assignments] = await Promise.all([
    getActivePass(id),
    listCustomerAssignments(id, { companyId: user.companyId }),
  ])
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
            <Row label="Teléfono" value={customer.phone ?? undefined} />
            <Row
              label="Fecha de nacimiento"
              value={customer.birthDate
                ? new Date(customer.birthDate).toLocaleDateString('es-DO')
                : undefined}
            />
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
      {/* Assignments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Promociones asignadas</CardTitle>
            {canEdit && (
              <Button size="sm" asChild>
                <Link href={`/dashboard/clientes/${id}/asignar`}>+ Asignar</Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin promociones asignadas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promoción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.promotion?.name ?? ''}</TableCell>
                    <TableCell><AssignmentStatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-sm">
                      {a.usesConsumed}{a.usesAllowed != null ? `/${a.usesAllowed}` : ''}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('es-DO') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/clientes/${id}/asignaciones/${a.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ?? ''}</span>
    </div>
  )
}
