import Image from 'next/image'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { EstadoBadge } from '@/components/EstadoBadge'
import { ConfirmarPagoButton, RechazarPagoButton } from '@/components/admin/ValidarPagoActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, ExternalLink } from 'lucide-react'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url)
}

export default async function PagosPage() {
  const user = await requireRole(['ADMIN_EMPRESA', 'SUPERADMIN'])
  const companyId = companyFilter(user)

  const pendientes = await prisma.membership.findMany({
    where: {
      estado: 'PENDIENTE_PAGO',
      ...(companyId ? { cliente: { companyId } } : {}),
    },
    include: {
      cliente: { include: { company: true } },
      plan: true,
      metodoPago: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Validación de pagos</h1>
          <p className="text-slate-500">
            {pendientes.length} comprobante{pendientes.length !== 1 ? 's' : ''} esperando revisión
          </p>
        </div>
      </div>

      {pendientes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Sin comprobantes pendientes</p>
            <p className="text-sm">Todos los pagos han sido revisados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {pendientes.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <CardHeader className="border-b bg-blue-50 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      <Link
                        href={`/admin/clientes/${m.clienteId}`}
                        className="text-sky-600 hover:underline"
                      >
                        {m.cliente.nombre}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-slate-500">{m.cliente.email}</p>
                    {user.metadata.role === 'SUPERADMIN' && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {m.cliente.company.name}
                      </Badge>
                    )}
                  </div>
                  <EstadoBadge estado={m.estado as MembershipEstado} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Plan info */}
                <div className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p>
                    <span className="text-slate-500">Plan:</span>{' '}
                    <strong>{m.plan.nombre}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Precio:</span>{' '}
                    <strong>
                      RD${new Intl.NumberFormat('es-DO').format(Number(m.plan.precio))}
                    </strong>
                  </p>
                  {m.metodoPago && (
                    <p>
                      <span className="text-slate-500">Método:</span>{' '}
                      {m.metodoPago.nombre}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Enviado: {fmtDate(m.updatedAt)}
                  </p>
                </div>

                {/* Comprobante preview */}
                {m.comprobanteUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                      Comprobante:
                    </p>
                    {isImage(m.comprobanteUrl) ? (
                      <a
                        href={m.comprobanteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Image
                          src={m.comprobanteUrl}
                          alt="Comprobante"
                          width={400}
                          height={300}
                          className="w-full rounded-lg border object-cover"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                        />
                      </a>
                    ) : (
                      <a
                        href={m.comprobanteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-sky-600 hover:bg-slate-50"
                      >
                        <FileText className="h-5 w-5" />
                        Ver comprobante (PDF)
                        <ExternalLink className="ml-auto h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Client note */}
                {m.comprobanteNota && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    <p className="font-medium">Nota del cliente:</p>
                    <p>{m.comprobanteNota}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <ConfirmarPagoButton membershipId={m.id} />
                  <RechazarPagoButton membershipId={m.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
