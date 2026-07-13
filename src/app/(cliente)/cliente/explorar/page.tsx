import Link from 'next/link'
import { Search, Store, Compass } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getCompaniesPublic } from '@/modules/marketplace/queries'
import { getSeguidasIds } from '@/modules/social/queries'
import { ExplorarEmpresasList } from '@/components/cliente/ExplorarEmpresasList'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

  const [companies, seguidas] = await Promise.all([
    getCompaniesPublic({ search: search || undefined, limit: 100 }),
    getSeguidasIds(user.metadata.dbUserId),
  ])

  return (
    <main className="container max-w-5xl py-8">
      {/* ── Cabecera ──────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Directorio
            </p>
            <h1 className="mt-1.5 text-h1 tracking-tight text-foreground">
              Explorar empresas
            </h1>
            <p className="mt-1 text-small text-muted-foreground">
              Descubre negocios afiliados, síguelos y únete a sus membresías.
            </p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <form
          action="/cliente/explorar"
          className="mt-6 flex max-w-lg gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={search}
              placeholder="Buscar por nombre o descripción…"
              className="rounded-xl pl-9"
            />
          </div>
          <Button type="submit" variant="outline" className="rounded-xl">
            Buscar
          </Button>
        </form>
      </header>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      {companies.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-10 text-center shadow-card">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-info/10 blur-3xl" />
          <div className="relative mx-auto flex max-w-md flex-col items-center gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Store className="h-8 w-8 text-muted-foreground" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {search
                  ? `Sin resultados para "${search}"`
                  : 'No hay empresas disponibles'}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {search
                  ? 'Prueba con otro término o mira todas las empresas.'
                  : 'Vuelve pronto, nuevas empresas se unen cada día.'}
              </p>
            </div>
            {search && (
              <Button asChild variant="outline">
                <Link href="/cliente/explorar">Ver todas</Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Result count */}
          <div className="mb-5 flex items-center gap-2">
            <Compass className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {companies.length} empresa{companies.length !== 1 ? 's' : ''}
              {search ? ` para "${search}"` : ' disponibles'}
            </p>
          </div>

          <ExplorarEmpresasList
            empresas={companies.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              type: c.type,
              logoUrl: c.logoUrl,
              bannerUrl: c.bannerUrl,
              ciudad: c.ciudad,
              totalMembersCount: c.totalMembersCount,
              activePromotionsCount: c.activePromotionsCount,
            }))}
            seguidasIds={[...seguidas]}
          />
        </>
      )}
    </main>
  )
}
