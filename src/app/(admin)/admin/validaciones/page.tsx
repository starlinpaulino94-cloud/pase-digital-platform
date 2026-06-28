export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { listCompanyValidations } from '@/modules/validacion-qr/queries'
import { listAllCompanies } from '@/modules/empresas/queries'
import { ValidationStatusBadge } from '@/components/validations/ValidationStatusBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function AdminValidacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>
}) {
  await requireSuperAdmin()
  const { companyId } = await searchParams

  const { items: companies } = await listAllCompanies({ status: 'ACTIVE' })
  const targetCompanyId = companyId ?? companies[0]?.id

  const { items: validations, total } = targetCompanyId
    ? await listCompanyValidations(targetCompanyId)
    : { items: [], total: 0 }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Validaciones QR</h1>

      {/* Company filter */}
      <form method="GET" className="flex items-center gap-3">
        <select
          name="companyId"
          defaultValue={targetCompanyId}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-accent">
          Filtrar
        </button>
      </form>

      <p className="text-sm text-muted-foreground">{total} validaciones</p>

      <div className="rounded-md border">
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
            {validations.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Sin validaciones para esta empresa.
                </TableCell>
              </TableRow>
            )}
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
                    <Link href={`/admin/validaciones/${v.id}`}>Ver</Link>
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
