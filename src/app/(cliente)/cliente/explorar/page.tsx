import Link from 'next/link'
import { Search, Store } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getCompaniesPublic, getCategoriesPublic } from '@/modules/marketplace/cached'
import { getSeguidasIds } from '@/modules/social/queries'
import { ExplorarEmpresasList } from '@/components/cliente/ExplorarEmpresasList'
import { EmptyState } from '@/components/system/EmptyState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Explorar empresas',
  description: 'Descubre negocios afiliados y únete a sus membresías',
}

export default async function ExplorarEmpresasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireRole('CLIENTE')
  const params = await searchParams
  const search = typeof params.q === 'string' ? params.q.trim() : ''
  const category = typeof params.category === 'string' ? params.category : ''

  const [companies, seguidas, categorias] = await Promise.all([
    getCompaniesPublic({
      search: search || undefined,
      category: category || undefined,
      limit: 100,
    }),
    getSeguidasIds(user.metadata.dbUserId),
    getCategoriesPublic().catch(() => []),
  ])

  /** Chips: conservan la búsqueda activa al cambiar de categoría. */
  const chipHref = (slug: string | null) => {
    const qs = new URLSearchParams()
    if (search) qs.set('q', search)
    if (slug) qs.set('category', slug)
    const s = qs.toString()
    return `/cliente/explorar${s ? `?${s}` : ''}`
  }

  return (
    <main className="container max-w-5xl py-8">
      {/* ── Cabecera app-style: título grande + buscador protagonista ──────── */}
      <header className="animate-fade-up mb-6">
        <h1 className="text-h1 text-foreground">Encuentra membresías</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suscríbete a los mejores negocios cerca de ti y ahorra en cada visita.
        </p>

        {/* Buscador grande, redondo, de app móvil */}
        <form action="/cliente/explorar" className="mt-5">
          {category && <input type="hidden" name="category" value={category} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Buscar lavados, peluquerías, gym…"
              className="h-13 w-full rounded-2xl border border-border/60 bg-card pl-12 pr-4 text-[15px] text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </form>

        {/* Chips de categoría */}
        {categorias.length > 0 && (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            <Link
              href={chipHref(null)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition',
                !category
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Todos
            </Link>
            {categorias.map((cat) => (
              <Link
                key={cat.slug}
                href={chipHref(cat.slug)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition',
                  category === cat.slug
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      {companies.length === 0 ? (
        <EmptyState
          icon={Store}
          title={
            search
              ? `Sin resultados para "${search}"`
              : 'No hay empresas disponibles'
          }
          description={
            search
              ? 'Prueba con otro término o mira todas las empresas.'
              : 'Vuelve pronto, nuevas empresas se unen cada día.'
          }
          action={
            (search || category) && (
              <Button asChild variant="outline">
                <Link href="/cliente/explorar">Ver todas</Link>
              </Button>
            )
          }
        />
      ) : (
        <ExplorarEmpresasList
          empresas={companies.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            type: c.type,
            logoUrl: c.logoUrl,
            bannerUrl: c.bannerUrl,
            ciudad: c.ciudad,
            descripcion: c.description,
            totalMembersCount: c.totalMembersCount,
            activePromotionsCount: c.activePromotionsCount,
            desdePlan: c.desdePlan ?? null,
          }))}
          seguidasIds={[...seguidas]}
        />
      )}
    </main>
  )
}
