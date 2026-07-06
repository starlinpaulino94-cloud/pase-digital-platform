import Image from 'next/image'
import { ADMIN_ROLES } from '@/types'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { EstadoBadge } from '@/components/EstadoBadge'
import {
  ConfirmarPagoButton,
  RechazarPagoButton,
  SolicitarEvidenciaButton,
  NotaInternaForm,
} from '@/components/admin/ValidarPagoActions'
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

interface PendienteRow {
  id: string
  estado: string
  clienteId: string
  updatedAt: Date
  comprobanteUrl: string | null
  comprobanteNota: string | null
  adminNota: string | null
  cliente: { nombre: string; email: string; company: { name: string } }
  plan: { nombre: string; precio: unknown }
  metodoPago: { nombre: string } | null
}

export default async function PagosPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  let pendientes: PendienteRow[] = []
  try {
    const data = await prisma.membership.findMany({
      where: {
        estado: 'PENDIENTE_PAGO',
        ...(companyId ? { cliente: { companyId } } : {}),
      },
      select: {
        id: true,
        estado: true,
        clienteId: true,
        updatedAt: true,
        cliente: {
          select: { nombre: true, email: true, company: { select: { name: true } } },
        },
        plan: { select: { nombre: true, precio: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    pendientes = data.map((m) => ({
      ...m,
      comprobanteUrl: null,
      comprobanteNota: null,
      adminNota: null,
      metodoPago: null,
    }))
  } catch (e) {
    console.error('[admin-pagos] basic query', e)
  }

  // Try loading extended fields
  if (pendientes.length === 0) {
    try {
      const data = await prisma.membership.findMany({
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
      pendientes = data.map((m) => ({
        id: m.id,
        estado: m.estado,
        clienteId: m.clienteId,
        updatedAt: m.updatedAt,
        comprobanteUrl: (m as Record<string, unknown>).comprobanteUrl as string | null ?? null,
        comprobanteNota: (m as Record<string, unknown>).comprobanteNota as string | null ?? null,
        adminNota: (m as Record<string, unknown>).adminNota as string | null ?? null,
        cliente: { nombre: m.cliente.nombre, email: m.cliente.email, company: { name: m.cliente.company.name } },
        plan: { nombre: m.plan.nombre, precio: m.plan.precio },
        metodoPago: (m as Record<string, unknown>).metodoPago as { nombre: string } | null ?? null,
      }))
    } catch {}
  }

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

                {m.comprobanteNota && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    <p className="font-medium">Nota del cliente:</p>
                    <p>{m.comprobanteNota}</p>
                  </div>
                )}

                {m.adminNota && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Nota interna</p>
                    <p>{m.adminNota}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <ConfirmarPagoButton membershipId={m.id} />
                  <RechazarPagoButton membershipId={m.id} />
                  <SolicitarEvidenciaButton membershipId={m.id} />
                </div>

                <div className="border-t pt-3">
                  <NotaInternaForm membershipId={m.id} notaActual={m.adminNota ?? null} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
