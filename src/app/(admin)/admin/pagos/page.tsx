import { Clock, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { PagoAdminActions } from '@/components/pagos/PagoAdminActions'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ADMIN_ROLES } from '@/types'

export const dynamic = 'force-dynamic'

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-DO').format(n)
}

function formatDate(s: Date | null) {
  if (!s) return '—'
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(s)
}

export default async function PagosPage() {
  const user = await requireRole(ADMIN_ROLES)

  // Obtener pagos (pendientes primero, luego historial)
  const companyId = user.metadata.role === 'SUPERADMIN' ? undefined : user.metadata.companyId

  const [pendientes, procesados] = await Promise.all([
    prisma.payment.findMany({
      where: {
        estado: 'PENDIENTE',
        ...(companyId ? { membership: { cliente: { companyId } } } : {}),
      },
      include: {
        membership: {
          include: {
            plan: true,
            cliente: { include: { company: true } },
          },
        },
        confirmadoPor: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      where: {
        estado: { in: ['APROBADO', 'RECHAZADO'] },
        ...(companyId ? { membership: { cliente: { companyId } } } : {}),
      },
      include: {
        membership: {
          include: {
            plan: true,
            cliente: { include: { company: true } },
          },
        },
        confirmadoPor: true,
      },
      orderBy: { fechaConfirmacion: 'desc' },
      take: 20,
    }),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pagos"
        description="Valida comprobantes y aprueba o rechaza pagos pendientes."
      />

      {/* Pendientes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">
            Pendientes de validación ({pendientes.length})
          </h2>
        </div>

        {pendientes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              No hay pagos pendientes.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendientes.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {p.membership.cliente.nombre}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {p.membership.plan.nombre}
                        </Badge>
                        <Badge
                          className={
                            p.metodo === 'TRANSFERENCIA'
                              ? 'bg-sky-100 text-sky-700 hover:bg-sky-100'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                          }
                        >
                          {p.metodo === 'TRANSFERENCIA'
                            ? 'Transferencia'
                            : 'Presencial'}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-500">
                        <p>
                          Monto: <strong>RD${formatPrice(Number(p.monto))}</strong>
                          {' · '}
                          Solicitado: {formatDate(p.createdAt)}
                        </p>
                        {p.referencia && (
                          <p>Referencia: {p.referencia}</p>
                        )}
                        {p.membership.cliente.company && (
                          <p>Empresa: {p.membership.cliente.company.name}</p>
                        )}
                      </div>
                      {p.comprobanteUrl && (
                        <a
                          href={p.comprobanteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:underline"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Ver comprobante
                        </a>
                      )}
                    </div>
                    <PagoAdminActions paymentId={p.id} metodo={p.metodo} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Procesados (historial) */}
      {procesados.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Procesados recientemente</h2>
          <div className="space-y-2">
            {procesados.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {p.estado === 'APROBADO' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {p.membership.cliente.nombre} · {p.membership.plan.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        RD${formatPrice(Number(p.monto))} · {p.metodo} ·{' '}
                        {formatDate(p.fechaConfirmacion)}
                        {p.confirmadoPor && ` · por ${p.confirmadoPor.name}`}
                      </p>
                      {p.motivoRechazo && (
                        <p className="text-xs text-red-600">
                          Motivo: {p.motivoRechazo}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    className={
                      p.estado === 'APROBADO'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                    }
                  >
                    {p.estado}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
