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
import {
  AprobarCompraButton,
  RechazarCompraButton,
} from '@/components/admin/ValidarCompraActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBanner } from '@/components/ui/status-banner'
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
  const [pendientesData, cambiosData, comprasData] = await Promise.all([
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
    // Fase E5: compras de promociones esperando validación del pago.
    prisma.productoCompra
      .findMany({
        where: {
          estado: 'EN_VALIDACION',
          ...(companyId ? { companyId } : {}),
        },
        select: {
          id: true,
          clienteId: true,
          updatedAt: true,
          comprobanteUrl: true,
          comprobanteNota: true,
          transferenciaFecha: true,
          precioCongelado: true,
          cliente: {
            select: { nombre: true, email: true, company: { select: { name: true } } },
          },
          promocion: { select: { titulo: true } },
          metodoPago: { select: { nombre: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      })
      .catch((e) => {
        console.error('[admin-pagos] compras query', e)
        return null
      }),
  ])

  const loadError = pendientesData === null || cambiosData === null || comprasData === null
  const pendientes: PendienteRow[] = pendientesData ?? []
  const cambios = cambiosData ?? []
  const compras = comprasData ?? []

  return (
    <div className="space-y-6">
      {loadError && (
        <StatusBanner variant="destructive" title="No se pudieron cargar los pagos">
          Es un problema temporal; recarga la página en unos segundos. Si
          persiste, avisa al equipo técnico.
        </StatusBanner>
      )}
      <PageHeader
        title="Validación de pagos"
        description={`${pendientes.length} comprobante${pendientes.length !== 1 ? 's' : ''} esperando revisión`}
      />

      {/* Fase E5: compras de promociones por validar */}
      {compras.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-h4 text-foreground">
            Compras de promociones ({compras.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {compras.map((c) => (
              <Card key={c.id} className="overflow-hidden border-primary/25">
                <CardHeader className="border-b bg-primary/5 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        <Link
                          href={`/admin/clientes/${c.clienteId}`}
                          className="text-primary hover:underline"
                        >
                          {c.cliente.nombre}
                        </Link>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{c.cliente.email}</p>
                      {user.metadata.role === 'SUPERADMIN' && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {c.cliente.company.name}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="info">Promoción</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p>
                      <span className="text-muted-foreground">Promoción:</span>{' '}
                      <strong>{c.promocion?.titulo ?? '—'}</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Monto esperado:</span>{' '}
                      <strong>{fmtMoney(Number(c.precioCongelado ?? 0))}</strong>
                    </p>
                    {c.metodoPago && (
                      <p>
                        <span className="text-muted-foreground">Método:</span> {c.metodoPago.nombre}
                      </p>
                    )}
                    {c.transferenciaFecha && (
                      <p>
                        <span className="text-muted-foreground">Transferencia declarada:</span>{' '}
                        {fmtDate(c.transferenciaFecha)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enviado: {fmtDate(c.updatedAt)}
                    </p>
                  </div>

                  {c.comprobanteUrl &&
                    (isImage(c.comprobanteUrl) ? (
                      <a href={c.comprobanteUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <Image
                          src={c.comprobanteUrl}
                          alt="Comprobante de la compra"
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
                        className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-primary hover:bg-muted"
                      >
                        <FileText className="h-5 w-5" />
                        Ver comprobante (PDF)
                        <ExternalLink className="ml-auto h-4 w-4" />
                      </a>
                    ))}

                  {c.comprobanteNota && (
                    <div className="rounded-lg bg-warning/15 p-3 text-sm text-warning-foreground">
                      <p className="font-medium">Nota del cliente:</p>
                      <p>{c.comprobanteNota}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <AprobarCompraButton compraId={c.id} />
                    <RechazarCompraButton compraId={c.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cambios de plan solicitados */}
      {cambios.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-h4 text-foreground">
            Cambios de plan solicitados ({cambios.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {cambios.map((c) => (
              <Card key={c.id} className="overflow-hidden border-info/30">
                <CardHeader className="border-b bg-info/5 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        <Link
                          href={`/admin/clientes/${c.clienteId}`}
                          className="text-primary hover:underline"
                        >
                          {c.cliente.nombre}
                        </Link>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{c.cliente.email}</p>
                      {user.metadata.role === 'SUPERADMIN' && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {c.cliente.company.name}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="info">Cambio de plan</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-center gap-3 rounded-lg bg-muted p-3 text-sm">
                    <span className="font-medium text-muted-foreground">{c.plan.nombre}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">
                      {c.planSolicitado?.nombre}
                      {c.planSolicitado != null && (
                        <span className="ml-1 text-muted-foreground">
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
                        className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-primary hover:bg-muted"
                      >
                        <FileText className="h-5 w-5" />
                        Ver comprobante (PDF)
                        <ExternalLink className="ml-auto h-4 w-4" />
                      </a>
                    )
                  ) : (
                    <p className="rounded-lg bg-warning/15 p-3 text-xs text-warning-foreground">
                      El cliente aún no ha subido el comprobante del nuevo plan.
                    </p>
                  )}

                  {c.comprobanteNota && (
                    <div className="rounded-lg bg-warning/15 p-3 text-sm text-warning-foreground">
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
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="Sin comprobantes pendientes"
            description="Todos los pagos han sido revisados."
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {pendientes.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <CardHeader className="border-b bg-info/5 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      <Link
                        href={`/admin/clientes/${m.clienteId}`}
                        className="text-primary hover:underline"
                      >
                        {m.cliente.nombre}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{m.cliente.email}</p>
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
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Plan:</span>{' '}
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
                          <span className="text-muted-foreground">Precio:</span>{' '}
                          <strong>{fmtMoney(Number(m.plan.precio))}</strong>
                        </p>
                      )
                    }
                    return (
                      <>
                        <p>
                          <span className="text-muted-foreground">Precio:</span>{' '}
                          <span className="line-through">{fmtMoney(Number(m.plan.precio))}</span>{' '}
                          <span className="text-success">
                            −{fmtMoney(desc)} bienvenida
                          </span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Monto esperado:</span>{' '}
                          <strong>{fmtMoney(Math.max(0, Number(m.plan.precio) - desc))}</strong>
                        </p>
                      </>
                    )
                  })()}
                  {m.metodoPago && (
                    <p>
                      <span className="text-muted-foreground">Método:</span>{' '}
                      {m.metodoPago.nombre}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enviado: {fmtDate(m.updatedAt)}
                  </p>
                </div>

                {m.comprobanteUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
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
                        className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-primary hover:bg-muted"
                      >
                        <FileText className="h-5 w-5" />
                        Ver comprobante (PDF)
                        <ExternalLink className="ml-auto h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                {m.comprobanteNota && (
                  <div className="rounded-lg bg-warning/15 p-3 text-sm text-warning-foreground">
                    <p className="font-medium">Nota del cliente:</p>
                    <p>{m.comprobanteNota}</p>
                  </div>
                )}

                {m.adminNota && (
                  <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Nota interna</p>
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
