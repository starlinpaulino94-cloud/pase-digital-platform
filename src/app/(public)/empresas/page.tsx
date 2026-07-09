import Link from 'next/link'
import { Star } from 'lucide-react'
import { SearchBar } from '@/components/public/SearchBar'
import { CategoryTabs } from '@/components/public/CategoryTabs'
import { CompanyGrid } from '@/components/public/CompanyGrid'
import {
  getCompaniesPublic,
  getCategoriesPublic,
} from '@/modules/marketplace/queries'

interface EmpresasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const revalidate = 3600

export default async function EmpresasPage({ searchParams }: EmpresasPageProps) {
  const params = await searchParams
  // Aterrizaje desde el callback de Google sin empresa de contexto (O-16):
  // guiamos al usuario a registrarse desde la página de una empresa.
  const desdeGoogle = params.google === 'registro'

  const filters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    category: typeof params.category === 'string' ? params.category : undefined,
    city: typeof params.city === 'string' ? params.city : undefined,
    country: typeof params.country === 'string' ? params.country : undefined,
    type: typeof params.type === 'string' ? params.type : undefined,
    featured:
      typeof params.featured === 'string'
        ? params.featured === 'true'
        : undefined,
    limit: 50,
    offset: 0,
  }

  const [companies, categories] = await Promise.all([
    getCompaniesPublic(filters),
    getCategoriesPublic(),
  ])

  return (
    <div className="min-h-screen bg-white">
      {desdeGoogle && (
        <div className="border-b border-sky-200 bg-sky-50 px-4 py-3 text-center text-sm text-sky-900">
          Para crear tu cuenta con Google, entra a la página de la empresa donde
          quieres registrarte y usa allí <strong>«Continuar con Google»</strong>.
        </div>
      )}
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-900 pb-16 pt-14">
        <div className="absolute inset-0 bg-grid-light mask-fade" />
        <div className="absolute -top-16 right-10 h-56 w-56 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="relative mx-auto max-w-7xl space-y-7 px-4 sm:px-6 lg:px-8">
          <div className="text-white">
            <h1 className="animate-slide-up text-4xl font-extrabold tracking-tight sm:text-5xl">
              Explora empresas
            </h1>
            <p className="mt-3 max-w-xl animate-slide-up text-lg text-sky-100/90 delay-75">
              Descubre negocios afiliados, sus planes de membresía y promociones
              exclusivas.
            </p>
          </div>
          <div className="animate-slide-up delay-100">
            <SearchBar placeholder="Buscar empresas..." />
          </div>
        </div>
      </section>

      {/* Categorías + filtro destacadas (barra pegajosa, sin sidebar) */}
      <section className="sticky top-[4.5rem] z-30 border-b border-border/60 bg-white/85 py-3 glass">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <CategoryTabs categories={categories} isLoading={false} />
          </div>
          <Link
            href={filters.featured ? '/empresas' : '/empresas?featured=true'}
            className={`hidden flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-150 sm:inline-flex ${
              filters.featured
                ? 'bg-blue-600 text-white shadow-glow'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Star className="h-3.5 w-3.5" /> Destacadas
          </Link>
        </div>
      </section>

      {/* Grid a ancho completo */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CompanyGrid
            companies={companies}
            isLoading={false}
            emptyMessage={
              filters.search || filters.category || filters.type
                ? 'No se encontraron empresas con esos filtros'
                : 'No hay empresas disponibles'
            }
          />
        </div>
      </section>
    </div>
  )
}
