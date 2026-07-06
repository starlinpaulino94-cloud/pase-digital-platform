import { SearchBar } from '@/components/public/SearchBar'
import { CategoryTabs } from '@/components/public/CategoryTabs'
import { CompanyGrid } from '@/components/public/CompanyGrid'
import { FilterPanel } from '@/components/public/FilterPanel'
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
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900">
              Explora Empresas
            </h1>
            <p className="text-neutral-600 mt-2 text-lg">
              Descubre los mejores establecimientos y sus promociones exclusivas
            </p>
          </div>
          <SearchBar placeholder="Buscar empresas..." />
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-neutral-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CategoryTabs categories={categories} isLoading={false} />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <FilterPanel />
            </div>

            {/* Grid */}
            <div className="md:col-span-3">
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
          </div>
        </div>
      </section>
    </div>
  )
}
