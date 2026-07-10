import Image from 'next/image'
import { ADMIN_ROLES } from '@/types'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { getRegionalPrefs } from '@/modules/empresas/regional'
import { formatMoney } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { EstadoBadge } from '@/components/EstadoBadge'
import {
  ConfirmarPagoButton,
  RechazarPagoButton,
  SolicitarEvidenciaButton,
  NotaInternaForm,
} from '@/components/admin/ValidarPagoActions'
import {
  AprobarCambioButton,
  RechazarCambioButton,
} from '@/components/admin/CambioPlanActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, ExternalLink, ArrowRight } from 'lucide-react'
import type { MembershipEstado } from '@/types'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo',
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
  // O-13: descuento de bienvenida congelado (solo aplica si nunca se activó).
  descuentoBienvenida: unknown | null
  fechaInicio: Date | null
}

export default async function PagosPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)
  const prefs = await getRegionalPrefs(companyId)
  const fmtMoney = (n: number) => formatMoney(n, prefs)

  // Una sola query por lista, en paralelo, con select mínimo, take y filtro
  // directo por memberships.companyId. Antes: 3 findMany secuenciales sin
  // límite, y un "fallback" invertido que además anulaba comprobanteUrl en
  // el caso con pendientes (no se veía el comprobante).
  // Un rechazo de la query se distingue de "no hay pendientes": si tragáramos
  // el error como [] el admin dejaría de validar pagos sin darse cuenta.
  // null = la query falló (se distingue de [] = sin resultados) para poder
  // mostrar un aviso en vez de fingir "no hay pagos pendientes".
  const [pendientesData, cambiosData] = await Promise.all([
    prisma.membership
      .findMany({
        where: {
          estado: 'PENDIENTE_PAGO',
          ...(companyId ? { companyId } : {}),
        },
        select: {
          id: true,
          estado: true,
          clienteId: true,
          updatedAt: true,
          comprobanteUrl: true,
          comprobanteNota: true,
          adminNota: true,
          descuentoBienvenida: true,
          fechaInicio: true,
          cliente: {
            select: { nombre: true, email: true, company: { select: { name: true } } },
          },
          plan: { select: { nombre: true, precio: true } },
          metodoPago: { select: { nombre: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      })
      .catch((e) => {
        console.error('[admin-pagos] pendientes query', e)
        return null
      }),
    prisma.membership
      .findMany({
        where: {
          estado: 'ACTIVA',
          planIdSolicitado: { not: null },
          ...(companyId ? { companyId } : {}),
        },
        select: {
          id: true,
          clienteId: true,
          updatedAt: true,
          comprobanteUrl: true,
          comprobanteNota: true,
          cliente: {
            select: { nombre: true, email: true, company: { select: { name: true } } },
          },
          plan: { select: { nombre: true } },
          planSolicitado: { select: { nombre: true, precio: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      })
      .catch((e) => {
        console.error('[admin-pagos] cambios query', e)
        return null
      }),
  ])

  const loadError = pendientesData === null || cambiosData === null
  const pendientes: PendienteRow[] = pendientesData ?? []
  const cambios = cambiosData ?? []

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los pagos. Es un problema temporal; recarga la
          página en unos segundos. Si persiste, avisa al equipo técnico.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Validación de pagos</h1>
          <p className="text-slate-500">
            {pendientes.length} comprobante{pendientes.length !== 1 ? 's' : ''} esperando revisión
          </p>
        </div>
      </div>

      {/* Cambios de plan solicitados */}
      {cambios.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Cambios de plan solicitados ({cambios.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {cambios.map((c) => (
              <Card key={c.id} className="overflow-hidden border-sky-200">
                <CardHeader className="border-b bg-sky-50 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        <Link
                          href={`/admin/clientes/${c.clienteId}`}
                          className="text-sky-600 hover:underline"
                        >
                          {c.cliente.nombre}
                        </Link>
                      </CardTitle>
                      <p className="text-sm text-slate-500">{c.cliente.email}</p>
                      {user.metadata.role === 'SUPERADMIN' && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {c.cliente.company.name}
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-sky-100 text-sky-700">Cambio de plan</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                    <span className="font-medium text-slate-500">{c.plan.nombre}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">
                      {c.planSolicitado?.nombre}
                      {c.planSolicitado != null && (
                        <span className="ml-1 text-slate-500">
                          · {fmtMoney(Number(c.planSolicitado.precio))}
                        </span>
                      )}
                    </span>
                  </div>

                  {c.comprobanteUrl ? (
                    isImage(c.comprobanteUrl) ? (
                      <a href={c.comprobanteUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <Image
                          src={c.comprobanteUrl}
                          alt="Comprobante del cambio"
                          width={400}
                          height={300}
                          className="w-full rounded-lg border object-cover"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                        />
                      </a>
                    ) : (
                      <a
                        href={c.comprobanteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-sky-600 hover:bg-slate-50"
                      >
                        <FileText className="h-5 w-5" />
                        Ver comprobante (PDF)
                        <ExternalLink className="ml-auto h-4 w-4" />
                      </a>
                    )
                  ) : (
                    <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                      El cliente aún no ha subido el comprobante del nuevo plan.
                    </p>
                  )}

                  {c.comprobanteNota && (
                    <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                      <p className="font-medium">Nota del cliente:</p>
                      <p>{c.comprobanteNota}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <AprobarCambioButton membershipId={c.id} />
                    <RechazarCambioButton membershipId={c.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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
                  {(() => {
                    // O-13: monto esperado neto del descuento de bienvenida
                    // (solo si la membresía nunca se activó).
                    const desc =
                      m.fechaInicio == null ? Number(m.descuentoBienvenida ?? 0) : 0
                    if (desc <= 0) {
                      return (
                        <p>
                          <span className="text-slate-500">Precio:</span>{' '}
                          <strong>{fmtMoney(Number(m.plan.precio))}</strong>
                        </p>
                      )
                    }
                    return (
                      <>
                        <p>
                          <span className="text-slate-500">Precio:</span>{' '}
                          <span className="line-through">{fmtMoney(Number(m.plan.precio))}</span>{' '}
                          <span className="text-emerald-600">
                            −{fmtMoney(desc)} bienvenida
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-500">Monto esperado:</span>{' '}
                          <strong>{fmtMoney(Math.max(0, Number(m.plan.precio) - desc))}</strong>
                        </p>
                      </>
                    )
                  })()}
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
