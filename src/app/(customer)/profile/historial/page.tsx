export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId } from '@/modules/clientes/queries'
import { listCustomerValidations } from '@/modules/validacion-qr/queries'
import { ValidationStatusBadge } from '@/components/validations/ValidationStatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function HistorialPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId ? await getCustomerByUserId(session.dbUserId) : null
  if (!customer) redirect('/profile')

  const { items: validations, total } = await listCustomerValidations(customer.id)

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Historial de Validaciones</h1>
      <p className="text-sm text-muted-foreground">{total} registros</p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Promoción</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validations.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Sin historial de validaciones.
                </TableCell>
              </TableRow>
            )}
            {validations.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(v.scannedAt).toLocaleString('es-DO')}
                </TableCell>
                <TableCell className="text-sm">
                  {v.promotionAssignment?.promotion?.name ?? '—'}
                </TableCell>
                <TableCell>
                  <ValidationStatusBadge status={v.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
