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
import { Gift, Plus, Pencil, Lock, Globe, Eye, Share2, Heart, Archive } from 'lucide-react'

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
            <div className="rounded-lg bg-amber-100 p-2">
              <Gift className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{p.titulo}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                  {PROMO_TIPO_LABEL[p.tipo] ?? p.tipo}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                    p.visibilidad === 'privada'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-emerald-50 text-emerald-700'
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
                  <span className="text-slate-400">{p.company.name}</span>
                )}
              </div>
            </div>
          </div>
          <Badge variant={p.activo && !p.archivada ? 'default' : 'secondary'}>
            {p.archivada ? 'Archivada' : p.activo ? 'Activa' : 'Pausada'}
          </Badge>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.descripcion}</p>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
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
        <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
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

export default async function PromocionesPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  let promociones: PromoRow[] = []
  try {
    promociones = await fetchPromos(companyId ?? null)
  } catch (e) {
    console.error('[admin-promociones]', e)
  }

  const activas = promociones.filter((p) => !p.archivada)
  const archivadas = promociones.filter((p) => p.archivada)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promociones</h1>
          <p className="text-slate-500">
            Crea, programa y controla tus ofertas. Tus seguidores se notifican
            automáticamente.
          </p>
        </div>
        <Link href="/admin/promociones/nuevo">
          <Button className="bg-sky-500 hover:bg-sky-400">
            <Plus className="mr-2 h-4 w-4" />
            Nueva promoción
          </Button>
        </Link>
      </div>

      {activas.length === 0 && archivadas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <Gift className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Sin promociones publicadas</p>
            <p className="text-sm">Crea tu primera promoción para tus clientes.</p>
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
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700">
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
