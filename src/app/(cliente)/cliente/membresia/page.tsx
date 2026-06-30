import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { getClienteFull } from '@/modules/cliente/queries'
import { PlanSelector } from '@/components/membresia/PlanSelector'
import { ComprobanteForm } from '@/components/membresia/ComprobanteForm'
import { RenovarButton } from '@/components/membresia/RenovarButton'
import { EstadoBadge } from '@/components/EstadoBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Building2,
  CreditCard,
  User,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

export default async function MembresiaPage() {
  const user = await requireRole('CLIENTE')
  let cliente = null
  try {
    cliente = user.metadata.clienteId
      ? await getClienteFull(user.metadata.clienteId)
      : null
  } catch (e) {
    console.error('[cliente-membresia]', e)
    return (
      <p className="text-slate-600">
        No pudimos cargar tu información en este momento. Intenta de nuevo más tarde.
      </p>
    )
  }

  if (!cliente) {
    return <p className="text-slate-600">No se encontró tu información.</p>
  }

  const current = cliente.memberships[0]
  const hasActive = current?.estado === 'ACTIVA'

  let planes: Awaited<ReturnType<typeof prisma.plan.findMany>> = []
  try {
    planes = await prisma.plan.findMany({
      where: { companyId: cliente.companyId, activo: true },
      orderBy: { precio: 'asc' },
    })
  } catch (e) {
    console.error('[cliente-membresia] planes', e)
  }

  // Load payment methods for this company
  const metodosPago = current
    ? await prisma.metodoPago.findMany({
        where: { companyId: cliente.companyId, activo: true },
        orderBy: { createdAt: 'asc' },
      })
    : []

  const needsComprobante =
    current &&
    (current.estado === 'PENDIENTE' || current.estado === 'RECHAZADA')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi membresía</h1>
        <p className="text-slate-500">{cliente.company.name}</p>
      </div>

      {/* Current membership status */}
      {current && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Plan actual: {current.plan.nombre}</CardTitle>
            <EstadoBadge estado={current.estado as MembershipEstado} />
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {current.plan.esIlimitado ? (
              <p>Consumos ilimitados.</p>
            ) : (
              <p>Restantes este periodo: <strong>{current.lavadosRestantes}</strong></p>
            )}
            {current.fechaVencimiento && (
              <p>Vence: <strong>{fmtDate(current.fechaVencimiento)}</strong></p>
            )}

            {current.estado === 'PENDIENTE_PAGO' && (
              <Alert className="border-blue-200 bg-blue-50 text-blue-700">
                <AlertDescription>
                  Tu comprobante fue enviado y está siendo revisado. Te
                  notificaremos cuando sea aprobado.
                </AlertDescription>
              </Alert>
            )}

            {current.estado === 'RECHAZADA' && current.rechazadoReason && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Pago rechazado</AlertTitle>
                <AlertDescription>{current.rechazadoReason}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment instructions + comprobante upload */}
      {needsComprobante && metodosPago.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {current.estado === 'RECHAZADA' ? 'Reenviar comprobante' : 'Instrucciones de pago'}
          </h2>
          <p className="text-sm text-slate-500">
            Realiza tu pago usando uno de los métodos disponibles y sube tu
            comprobante para que el equipo lo confirme.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {metodosPago.map((m) => (
              <Card key={m.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {m.tipo === 'TRANSFERENCIA' ? (
                      <CreditCard className="h-5 w-5 text-sky-500" />
                    ) : (
                      <Building2 className="h-5 w-5 text-sky-500" />
                    )}
                    <CardTitle className="text-base">{m.nombre}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  {m.titular && (
                    <div className="flex items-start gap-2">
                      <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        <strong>Titular:</strong> {m.titular}
                      </span>
                    </div>
                  )}
                  {m.numeroCuenta && (
                    <div className="flex items-start gap-2">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        <strong>Número:</strong> {m.numeroCuenta}
                        {m.tipoCuenta ? ` (${m.tipoCuenta})` : ''}
                      </span>
                    </div>
                  )}
                  {m.instrucciones && (
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <p className="whitespace-pre-line">{m.instrucciones}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subir comprobante</CardTitle>
            </CardHeader>
            <CardContent>
              <ComprobanteForm
                membershipId={current.id}
                metodoPagoId={metodosPago[0]?.id ?? null}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {needsComprobante && metodosPago.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pendiente de configuración</AlertTitle>
          <AlertDescription>
            La empresa aún no ha configurado métodos de pago. Contacta
            directamente a {cliente.company.name} para coordinar tu pago.
          </AlertDescription>
        </Alert>
      )}

      {/* Plan selection */}
      {!hasActive && (
        <div className="space-y-4">
          {current?.estado === 'PENDIENTE_PAGO' ? (
            <Alert>
              <AlertDescription>
                Esperando confirmación de tu pago. No puedes cambiar de plan
                mientras está en revisión.
              </AlertDescription>
            </Alert>
          ) : current?.estado === 'VENCIDA' ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">Tu membresía venció</p>
                  <p className="text-sm text-slate-500">
                    Renueva con el mismo plan o elige uno diferente abajo.
                  </p>
                </div>
                <RenovarButton planId={current.planId} planNombre={current.plan.nombre} />
              </div>
              <div>
                <h2 className="mb-4 text-lg font-semibold text-slate-900">O elige otro plan</h2>
                <PlanSelector
                  disabled={false}
                  planes={planes.map((p) => ({
                    id: p.id,
                    nombre: p.nombre,
                    precio: new Intl.NumberFormat('es-DO').format(Number(p.precio)),
                    esIlimitado: p.esIlimitado,
                    descripcion: p.descripcion,
                    beneficios: p.beneficios,
                  }))}
                />
              </div>
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                {current ? 'Planes disponibles' : 'Elige tu plan'}
              </h2>
              <PlanSelector
                disabled={hasActive}
                planes={planes.map((p) => ({
                  id: p.id,
                  nombre: p.nombre,
                  precio: new Intl.NumberFormat('es-DO').format(Number(p.precio)),
                  esIlimitado: p.esIlimitado,
                  descripcion: p.descripcion,
                  beneficios: p.beneficios,
                }))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
