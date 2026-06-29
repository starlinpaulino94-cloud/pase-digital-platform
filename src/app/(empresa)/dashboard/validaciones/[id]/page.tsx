export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { getValidationById } from '@/modules/validacion-qr/queries'
import { listCustomerAssignments } from '@/modules/asignaciones/queries'
import { getVehiclesByCustomer } from '@/modules/vehiculos/queries'
import { ValidationStatusBadge } from '@/components/validations/ValidationStatusBadge'
import { ConfirmValidationForm } from '@/components/validations/ConfirmValidationForm'
import { RejectValidationForm } from '@/components/validations/RejectValidationForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function ValidationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')
  const { id } = await params

  const validation = await getValidationById(id)
  if (!validation) notFound()

  if (user.role !== 'SUPERADMIN' && validation.companyId !== user.companyId) notFound()

  const isPending = validation.status === 'SCANNED' || validation.status === 'EVALUATED'

  // Load active assignments and customer vehicles for confirmation form
  const [activeAssignments, customerVehicles] = isPending
    ? await Promise.all([
        listCustomerAssignments(validation.customerId, {
          status: 'ACTIVE',
          companyId: validation.companyId,
        }),
        getVehiclesByCustomer(validation.customerId),
      ])
    : [[], []]

  const assignmentOptions = activeAssignments.map((a) => ({
    id: a.id,
    promotionName: a.promotion?.name ?? '',
    promotionType: a.promotion?.type ?? '',
    usesConsumed: a.usesConsumed,
    usesAllowed: a.usesAllowed,
    expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString() : null,
  }))

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/validaciones">←</Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Validación QR</h1>
            <ValidationStatusBadge status={validation.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(validation.scannedAt).toLocaleString('es-DO')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
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
            <p>Estado: {validation.digitalPass?.isActive ? 'Activo' : 'Inactivo'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer vehicles */}
      {customerVehicles.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Vehículos del cliente</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customerVehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">
                    {v.year} {v.make} {v.model}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {v.color}{v.plate ? ` · ${v.plate}` : ''}{v.isDefault ? ' · Principal' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {validation.status === 'CONFIRMED' && validation.promotionAssignment && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Promoción consumida</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{validation.promotionAssignment.promotion?.name}</p>
            <p className="text-muted-foreground">
              Confirmado: {validation.confirmedAt
                ? new Date(validation.confirmedAt).toLocaleString('es-DO')
                : '—'}
            </p>
          </CardContent>
        </Card>
      )}

      {validation.receipt && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Comprobante</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-mono text-xs text-muted-foreground">{validation.receipt.id.slice(0, 12)}...</p>
            <p>Estado: {validation.receipt.status}</p>
            {validation.receipt.issuedAt && (
              <p className="text-muted-foreground">
                Emitido: {new Date(validation.receipt.issuedAt).toLocaleString('es-DO')}
              </p>
            )}
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

      {isPending && (
        <>
          <Separator />
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Confirmar uso</CardTitle></CardHeader>
              <CardContent>
                {assignmentOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este cliente no tiene promociones activas para esta empresa.
                  </p>
                ) : (
                  <ConfirmValidationForm
                    validationId={validation.id}
                    activeAssignments={assignmentOptions}
                    vehicles={customerVehicles}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Rechazar</CardTitle></CardHeader>
              <CardContent>
                <RejectValidationForm validationId={validation.id} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
