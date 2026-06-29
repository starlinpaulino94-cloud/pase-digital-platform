export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { getCustomerById, getActivePass } from '@/modules/clientes/queries'
import { listCustomerAssignments } from '@/modules/asignaciones/queries'
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge'
import { AssignmentStatusBadge } from '@/components/assignments/AssignmentStatusBadge'
import { RegeneratePassButton } from '@/components/customers/RegeneratePassButton'
import { DigitalPassQR } from '@/components/customers/DigitalPassQR'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default async function AdminClienteDetailPage({ params }: Props) {
  await requireSuperAdmin()
  const { id } = await params

  const [customer, pass, assignments] = await Promise.all([
    getCustomerById(id),
    getActivePass(id),
    listCustomerAssignments(id),
  ])

  if (!customer) notFound()

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/clientes">← Volver</Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{customer.firstName} {customer.lastName}</h1>
          <CustomerStatusBadge status={customer.status} />
        </div>
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
          <CardHeader><CardTitle className="text-base">Empresas asociadas</CardTitle></CardHeader>
          <CardContent>
            {(customer.customerCompanies ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin empresas asociadas.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customer.customerCompanies!.map((cc) => (
                  <Badge key={cc.id} variant="outline">{cc.company?.name}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pase Digital</CardTitle>
            <RegeneratePassButton customerId={customer.id} />
          </div>
        </CardHeader>
        <CardContent>
          {pass ? (
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <DigitalPassQR token={pass.token} />
              <div className="space-y-2 text-sm">
                <Row label="Estado" value={pass.isActive ? 'Activo' : 'Inactivo'} />
                <Row label="Activado" value={pass.activatedAt?.toLocaleDateString('es-DO') ?? ''} />
                <Row label="Token" value={`${pass.token.slice(0, 8)}...`} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin Pase Digital activo.</p>
          )}
        </CardContent>
      </Card>
      {/* Assignments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Promociones asignadas</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/admin/clientes/${id}/asignar`}>+ Asignar</Link>
            </Button>
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
                        <Link href={`/admin/clientes/${id}/asignaciones/${a.id}`}>Ver</Link>
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
