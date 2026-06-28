export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { listCompanyValidations } from '@/modules/validacion-qr/queries'
import { QRScannerForm } from '@/components/validations/QRScannerForm'
import { ValidationStatusBadge } from '@/components/validations/ValidationStatusBadge'
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

export default async function ValidacionesPage() {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')
  const companyId = user.companyId!

  const { items: validations, total } = await listCompanyValidations(companyId)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Validación QR</h1>

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
          <CardHeader>
            <CardTitle className="text-base">Historial reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">{total} validaciones en total</p>
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
                {validations.slice(0, 10).map((v) => (
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Sin validaciones.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
