export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId } from '@/modules/clientes/queries'
import { listCustomerValidations } from '@/modules/validacion-qr/queries'
import { ValidationStatusBadge } from '@/components/validations/ValidationStatusBadge'
import { PageNav } from '@/components/ui/page-nav'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 20

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId ? await getCustomerByUserId(session.dbUserId) : null
  if (!customer) redirect('/profile')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const { items: validations, total } = await listCustomerValidations(customer.id, {
    page,
    pageSize: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Historial de Validaciones</h1>
        <p className="text-sm text-muted-foreground">{total} registros</p>
      </div>

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
                  {v.promotionAssignment?.promotion?.name ?? ''}
                </TableCell>
                <TableCell>
                  <ValidationStatusBadge status={v.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PageNav
        page={page}
        totalPages={totalPages}
        buildHref={(p) => `/profile/historial?page=${p}`}
      />
    </div>
  )
}
