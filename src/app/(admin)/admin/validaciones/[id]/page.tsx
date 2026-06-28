export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { getValidationById } from '@/modules/validacion-qr/queries'
import { ValidationStatusBadge } from '@/components/validations/ValidationStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminValidationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperAdmin()
  const { id } = await params

  const validation = await getValidationById(id)
  if (!validation) notFound()

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/validaciones">←</Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Validación</h1>
          <ValidationStatusBadge status={validation.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">
              {validation.customer?.firstName} {validation.customer?.lastName}
            </p>
            <p className="text-muted-foreground">{validation.customer?.user.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Pase Digital</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p className="font-mono text-xs text-muted-foreground">
              {validation.digitalPass?.token
                ? `${validation.digitalPass.token.slice(0, 12)}...`
                : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Línea de tiempo</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {[
              ['Escaneado', validation.scannedAt],
              ['Evaluado', validation.evaluatedAt],
              ['Confirmado', validation.confirmedAt],
              ['Rechazado', validation.rejectedAt],
            ].map(([label, val]) => val ? (
              <div key={String(label)} className="flex justify-between">
                <span className="text-muted-foreground">{String(label)}</span>
                <span>{new Date(val as string).toLocaleString('es-DO')}</span>
              </div>
            ) : null)}
          </CardContent>
        </Card>

        {validation.status === 'CONFIRMED' && validation.promotionAssignment && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Promoción consumida</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{validation.promotionAssignment.promotion?.name}</p>
            </CardContent>
          </Card>
        )}

        {validation.status === 'REJECTED' && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Motivo de rechazo</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">{validation.rejectionReason}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        <p>Session ID: {validation.sessionId}</p>
      </div>
    </div>
  )
}
