export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { listCompanyValidations } from '@/modules/validacion-qr/queries'
import { QRScannerForm } from '@/components/validations/QRScannerForm'
import { ValidationStatusBadge } from '@/components/validations/ValidationStatusBadge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageNav } from '@/components/ui/page-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 20

export default async function ValidacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')
  const companyId = user.companyId!

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const { items: validations, total } = await listCompanyValidations(companyId, {
    page,
    pageSize: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Validación QR</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escanear Pase Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <QRScannerForm
              companyId={companyId}
              branchId={user.branchId ?? undefined}
              redirectBase="/dashboard/validaciones"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Historial</CardTitle>
            <span className="text-xs text-muted-foreground">{total} en total</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validations.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm">
                      {v.customer?.firstName} {v.customer?.lastName}
                    </TableCell>
                    <TableCell><ValidationStatusBadge status={v.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(v.scannedAt).toLocaleString('es-DO')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/validaciones/${v.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {validations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState title="Sin validaciones" description="Las validaciones escaneadas aparecerán aquí." className="py-8" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <PageNav
              page={page}
              totalPages={totalPages}
              buildHref={(p) => `/dashboard/validaciones?page=${p}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
