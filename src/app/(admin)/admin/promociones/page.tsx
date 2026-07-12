import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { PROMO_TIPO_LABEL } from '@/lib/promociones'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeletePromocionButton } from '@/components/admin/DeletePromocionButton'
import { PromoControls } from '@/components/admin/PromoControls'
import { CompartirOfertaButton } from '@/components/admin/CompartirOfertaButton'
import { Gift, Plus, Pencil, Lock, Globe, Eye, Share2, Heart, Archive, LayoutTemplate } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  if (!d) return null
  return new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(d))
}

type PromoRow = Awaited<ReturnType<typeof fetchPromos>>[number]

async function fetchPromos(companyId: string | null) {
  return prisma.promocion.findMany({
    where: companyId ? { companyId } : {},
    include: {
      company: { select: { name: true } },
      _count: { select: { guardadaPor: true } },
    },
    orderBy: [{ archivada: 'asc' }, { prioridad: 'desc' }, { createdAt: 'desc' }],
  })
}

function PromoCard({ p, showCompany }: { p: PromoRow; showCompany: boolean }) {
  return (
    <Card className={p.activo && !p.archivada ? '' : 'opacity-60'}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/15 p-2">
              <Gift className="h-5 w-5 text-warning-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{p.titulo}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-info/10 px-2 py-0.5 font-medium text-info">
                  {PROMO_TIPO_LABEL[p.tipo] ?? p.tipo}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                    p.visibilidad === 'privada'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-success/10 text-success'
                  }`}
                >
                  {p.visibilidad === 'privada' ? (
                    <>
                      <Lock className="h-3 w-3" /> Privada
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3" /> Pública
                    </>
                  )}
                </span>
                {showCompany && (
                  <span className="text-muted-foreground">{p.company.name}</span>
                )}
              </div>
            </div>
          </div>
          <Badge variant={p.activo && !p.archivada ? 'default' : 'secondary'}>
            {p.archivada ? 'Archivada' : p.activo ? 'Activa' : 'Pausada'}
          </Badge>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.descripcion}</p>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {p.vigenciaHasta && <span>Hasta {fmtDate(p.vigenciaHasta)}</span>}
          {p.maxCanjes != null && (
            <span>
              Canjes: {p.canjes}/{p.maxCanjes}
            </span>
          )}
          {p.codigo && <span>Código: {p.codigo}</span>}
          {p.prioridad !== 0 && <span>Prioridad {p.prioridad}</span>}
        </div>

        {/* Indicadores */}
        <div className="mt-3 flex gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {p.viewCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" /> {p.shareCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> {p._count.guardadaPor}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <CompartirOfertaButton
              path={`/promocion/${p.id}`}
              titulo={p.titulo}
              texto={`${p.titulo} — promoción de ${p.company.name} en MembeGo.`}
              advertencia={
                p.archivada || !p.activo
                  ? 'La promoción no está activa: el enlace no será visible hasta que la actives.'
                  : p.vigenciaHasta && new Date(p.vigenciaHasta) < new Date()
                    ? 'La promoción ya venció: el enlace no será visible.'
                    : p.visibilidad === 'privada'
                      ? 'Es privada: solo la verán clientes de tu empresa con sesión iniciada.'
                      : null
              }
            />
            <PromoControls
              id={p.id}
              titulo={p.titulo}
              activo={p.activo}
              archivada={p.archivada}
            />
            <Link href={`/admin/promociones/${p.id}/editar`}>
              <Button size="icon" variant="ghost" title="Editar" aria-label="Editar">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <DeletePromocionButton id={p.id} titulo={p.titulo} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Fase E5: métricas de ventas del ciclo de compras de promociones. */
async function fetchVentas(companyId: string | null) {
  const where = companyId ? { companyId } : {}
  const [porEstado, ingresos] = await Promise.all([
    prisma.productoCompra.groupBy({
      by: ['estado'],
      where,
      _count: { _all: true },
    }),
    prisma.productoCompra.aggregate({
      where: { ...where, pagoConfirmado: true },
      _sum: { montoPagado: true },
    }),
  ])
  const count = (estados: string[]) =>
    porEstado.filter((r) => estados.includes(r.estado)).reduce((s, r) => s + r._count._all, 0)

  const total = porEstado.reduce((s, r) => s + r._count._all, 0)
  const vendidas = count(['ACTIVA', 'CONSUMIDA', 'EXPIRADA'])
  return {
    total,
    vendidas,
    activas: count(['ACTIVA']),
    pendientes: count(['SOLICITADA', 'PENDIENTE_PAGO', 'APROBADA', 'RECHAZADA']),
    porValidar: count(['EN_VALIDACION']),
    consumidas: count(['CONSUMIDA']),
    vencidas: count(['EXPIRADA']),
    conversion: total > 0 ? Math.round((vendidas / total) * 100) : 0,
    ingresos: Number(ingresos._sum.montoPagado ?? 0),
  }
}

export default async function PromocionesPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  let promociones: PromoRow[] = []
  let ventas: Awaited<ReturnType<typeof fetchVentas>> | null = null
  try {
    ;[promociones, ventas] = await Promise.all([
      fetchPromos(companyId ?? null),
      fetchVentas(companyId ?? null),
    ])
  } catch (e) {
    console.error('[admin-promociones]', e)
  }

  const activas = promociones.filter((p) => !p.archivada)
  const archivadas = promociones.filter((p) => p.archivada)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promociones</h1>
          <p className="text-muted-foreground">
            Crea, programa y controla tus ofertas. Tus seguidores se notifican
            automáticamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/promociones/plantillas">
            <Button variant="outline">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Plantillas
            </Button>
          </Link>
          <Link href="/admin/promociones/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva promoción
            </Button>
          </Link>
        </div>
      </div>

      {/* Fase E5: panel de ventas del motor de compras */}
      {ventas && ventas.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Ingresos por promociones</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(ventas.ingresos)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">pagos confirmados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Vendidas</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{ventas.vendidas}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ventas.activas} activas · {ventas.consumidas} consumidas · {ventas.vencidas} vencidas
              </p>
            </CardContent>
          </Card>
          <Card className={ventas.porValidar > 0 ? 'border-warning/40' : ''}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Pagos por validar</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{ventas.porValidar}</p>
              {ventas.porValidar > 0 ? (
                <Link href="/admin/pagos" className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
                  Ir a validación de pagos →
                </Link>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">{ventas.pendientes} en proceso de pago</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Conversión de ventas</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{ventas.conversion}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ventas.vendidas} de {ventas.total} solicitudes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activas.length === 0 && archivadas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Gift className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Sin promociones publicadas</p>
            <p className="text-sm">Crea tu primera promoción para tus clientes.</p>
            <Link
              href="/admin/promociones/plantillas"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Empieza desde una plantilla →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {activas.map((p) => (
              <PromoCard key={p.id} p={p} showCompany={!companyId} />
            ))}
          </div>

          {archivadas.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <Archive className="h-4 w-4" />
                Archivadas ({archivadas.length})
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {archivadas.map((p) => (
                  <PromoCard key={p.id} p={p} showCompany={!companyId} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  )
}
