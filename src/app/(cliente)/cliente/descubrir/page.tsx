import { requireRole } from '@/lib/auth/guards'
import { SearchBar } from '@/components/public/SearchBar'
import { CategoryTabs } from '@/components/public/CategoryTabs'
import { CompanyGrid } from '@/components/public/CompanyGrid'
import { FilterPanel } from '@/components/public/FilterPanel'
import {
  getCompaniesPublic,
  getCategoriesPublic,
} from '@/modules/marketplace/queries'

export const dynamic = 'force-dynamic'

interface DescubrirPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Marketplace INTERNO: descubrir empresas sin salir de la aplicación. Reutiliza
 * los componentes de búsqueda/filtro del marketplace público (son agnósticos a
 * la ruta: empujan querystring relativo) y CompanyGrid con hrefBase interno.
 */
export default async function DescubrirPage({ searchParams }: DescubrirPageProps) {
  await requireRole('CLIENTE')
  const params = await searchParams

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Descubrir empresas</h1>
        <p className="text-slate-500">
          Explora negocios afiliados, sus planes de membresía y promociones
          exclusivas.
        </p>
      </div>

      <SearchBar placeholder="Buscar empresas..." />

      <CategoryTabs categories={categories} isLoading={false} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          <FilterPanel />
        </div>
        <div className="md:col-span-3">
          <CompanyGrid
            companies={companies}
            isLoading={false}
            hrefBase="/cliente/empresas"
            emptyMessage={
              filters.search || filters.category || filters.type
                ? 'No se encontraron empresas con esos filtros'
                : 'No hay empresas disponibles'
            }
          />
        </div>
      </div>
    </div>
  )
}
