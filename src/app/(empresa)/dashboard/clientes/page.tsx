export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { listCustomersByCompany } from '@/modules/clientes/queries'
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function ClientesPage() {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')
  const companyId = user.companyId!

  const { items: customers, total } = await listCustomersByCompany(companyId)

  const canCreate = user.role === 'ADMIN_EMPRESA' || user.role === 'SUPERADMIN'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{total} cliente{total !== 1 ? 's' : ''}</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/clientes/nuevo">+ Nuevo cliente</Link>
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay clientes registrados para esta empresa.
                </TableCell>
              </TableRow>
            )}
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                <TableCell className="text-sm">{c.user.email}</TableCell>
                <TableCell>{c.phone ?? ''}</TableCell>
                <TableCell><CustomerStatusBadge status={c.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/clientes/${c.id}`}>Ver</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
