import Link from 'next/link'
import {
  Gift,
  AlertCircle,
  Heart,
  Star,
  Sparkles,
  Clock,
  Compass,
  ThumbsUp,
  Flame,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import {
  getPromoFeed,
  getPromocionesGuardadas,
  getGuardadasIds,
  type PromoFeed,
} from '@/modules/social/queries'
import { PromotionCard } from '@/components/public/PromotionCard'
import { CompanyCard } from '@/components/public/CompanyCard'
import { SavePromoButton } from '@/components/cliente/SavePromoButton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PromotionPublic } from '@/modules/marketplace/types'

export const dynamic = 'force-dynamic'

function PromoGridConGuardar({
  promociones,
  guardadasIds,
}: {
  promociones: PromotionPublic[]
  guardadasIds: Set<string>
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {promociones.map((p) => (
        <div key={p.id} className="relative">
          <PromotionCard promotion={p} hrefBase="/cliente/promociones" />
          <SavePromoButton promocionId={p.id} guardada={guardadasIds.has(p.id)} />
        </div>
      ))}
    </div>
  )
}

function SeccionPromos({
  icon: Icon,
  iconClass,
  titulo,
  descripcion,
  promociones,
  guardadasIds,
}: {
  icon: LucideIcon
  iconClass: string
  titulo: string
  descripcion?: string
  promociones: PromotionPublic[]
  guardadasIds: Set<string>
}) {
  if (promociones.length === 0) return null
  return (
    <section className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Icon className={`h-5 w-5 ${iconClass}`} />
          {titulo}
        </h2>
        {descripcion && <p className="text-sm text-slate-500">{descripcion}</p>}
      </div>
      <PromoGridConGuardar promociones={promociones} guardadasIds={guardadasIds} />
    </section>
  )
}

export default async function PromocionesDisponiblesPage() {
  const user = await requireRole('CLIENTE')

  let feed: PromoFeed | null = null
  let guardadas: PromotionPublic[] = []
  let guardadasIds = new Set<string>()
  let loadError = false
  try {
    ;[feed, guardadas, guardadasIds] = await Promise.all([
      getPromoFeed(user.metadata.dbUserId),
      getPromocionesGuardadas(user.metadata.dbUserId),
      getGuardadasIds(user.metadata.dbUserId),
    ])
  } catch (e) {
    loadError = true
    console.error('[cliente-promociones]', e)
  }

  const sinPromos =
    feed != null &&
    feed.seguidas.length === 0 &&
    feed.destacadas.length === 0 &&
    feed.nuevas.length === 0 &&
    feed.expiranPronto.length === 0 &&
    feed.recomendadas.length === 0

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promociones para ti</h1>
        <p className="text-slate-500">
          Primero lo de las empresas que sigues; después, lo mejor del
          marketplace.
        </p>
      </div>

      {loadError || feed == null ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium text-foreground">No pudimos cargar las promociones.</p>
            <Button asChild variant="outline">
              <Link href="/cliente/promociones">Reintentar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Guardadas */}
          <SeccionPromos
            icon={Heart}
            iconClass="fill-rose-500 text-rose-500"
            titulo="Mis promociones guardadas"
            promociones={guardadas}
            guardadasIds={guardadasIds}
          />

          {/* Empresas que sigo */}
          <SeccionPromos
            icon={Star}
            iconClass="fill-amber-400 text-amber-400"
            titulo="De empresas que sigues"
            descripcion="Tus empresas favoritas aparecen primero."
            promociones={feed.seguidas}
            guardadasIds={guardadasIds}
          />

          {/* Destacadas */}
          <SeccionPromos
            icon={Flame}
            iconClass="text-orange-500"
            titulo="Promociones destacadas"
            promociones={feed.destacadas}
            guardadasIds={guardadasIds}
          />

          {/* Nuevas */}
          <SeccionPromos
            icon={Sparkles}
            iconClass="text-sky-500"
            titulo="Nuevas promociones"
            descripcion="Publicadas en los últimos 14 días."
            promociones={feed.nuevas}
            guardadasIds={guardadasIds}
          />

          {/* Expiran pronto */}
          <SeccionPromos
            icon={Clock}
            iconClass="text-red-500"
            titulo="Expiran pronto"
            descripcion="Aprovéchalas antes de que venzan."
            promociones={feed.expiranPronto}
            guardadasIds={guardadasIds}
          />

          {/* Recomendadas */}
          <SeccionPromos
            icon={ThumbsUp}
            iconClass="text-blue-500"
            titulo="Recomendadas para ti"
            descripcion="De empresas parecidas a las que sigues."
            promociones={feed.recomendadas}
            guardadasIds={guardadasIds}
          />

          {/* Sin promociones */}
          {sinPromos && guardadas.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center text-slate-500">
                <Gift className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium">No hay promociones activas por ahora</p>
                <p className="text-sm">
                  Sigue empresas para recibir sus promociones apenas se
                  publiquen.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/cliente/descubrir">Explorar empresas</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Descubrir empresas */}
          {feed.empresasRecomendadas.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Compass className="h-5 w-5 text-indigo-500" />
                    Descubrir empresas
                  </h2>
                  <p className="text-sm text-slate-500">
                    También podría interesarte seguirlas.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/cliente/descubrir">Ver todas</Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {feed.empresasRecomendadas.map((c) => (
                  <CompanyCard key={c.id} company={c} hrefBase="/cliente/empresas" />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
