export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { listCompanyPromotions } from '@/modules/promociones/queries'
import { PromotionStatusBadge } from '@/components/promotions/PromotionStatusBadge'
import { PromotionTypeBadge } from '@/components/promotions/PromotionTypeBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function DashboardPromocionesPage() {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')
  const companyId = user.companyId!

  const { items: promotions, total } = await listCompanyPromotions(companyId)

  const canCreate = user.role === 'ADMIN_EMPRESA' || user.role === 'SUPERADMIN'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Promociones</h1>
          <p className="text-sm text-muted-foreground">{total} promoción{total !== 1 ? 'es' : ''}</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/promociones/nueva">+ Nueva promoción</Link>
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay promociones. ¡Crea la primera!
                </TableCell>
              </TableRow>
            )}
            {promotions.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><PromotionTypeBadge type={p.type} /></TableCell>
                <TableCell><PromotionStatusBadge status={p.status} /></TableCell>
                <TableCell className="text-sm">
                  {p.usedCount}{p.maxUses != null ? `/${p.maxUses}` : ''}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('es-DO') : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/promociones/${p.id}`}>Ver</Link>
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
