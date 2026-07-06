import Link from 'next/link'
import { SearchBar } from '@/components/public/SearchBar'
import { PromotionGrid } from '@/components/public/PromotionGrid'
import { getPromotionsPublic } from '@/modules/marketplace/queries'

interface PromotionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const revalidate = 3600

export default async function PromotionsPage({
  searchParams,
}: PromotionsPageProps) {
  const params = await searchParams

  const filters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    company: typeof params.company === 'string' ? params.company : undefined,
    type: typeof params.type === 'string' ? params.type : undefined,
    tag: typeof params.tag === 'string' ? params.tag : undefined,
    limit: 50,
    offset: 0,
  }

  const promotions = await getPromotionsPublic(filters)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900">
              Todas las Promociones
            </h1>
            <p className="text-neutral-600 mt-2 text-lg">
              Descubre las mejores ofertas y beneficios disponibles
            </p>
          </div>
          <SearchBar placeholder="Buscar promociones..." />
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-neutral-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2">
          <span className="text-sm text-neutral-600 flex items-center">
            Filtrar por tipo:
          </span>
          <Link
            href="/promociones"
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              !filters.type
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Todas
          </Link>
          {['descuento', 'promocion', 'regalo', 'evento'].map((type) => (
            <Link
              key={type}
              href={`/promociones?type=${type}`}
              className={`px-3 py-1 rounded-full text-sm transition-colors capitalize ${
                filters.type === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {type}
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PromotionGrid
            promotions={promotions}
            isLoading={false}
            variant="default"
            emptyMessage={
              filters.search || filters.type || filters.tag
                ? 'No se encontraron promociones con esos criterios'
                : 'No hay promociones disponibles en este momento'
            }
          />
        </div>
      </section>
    </div>
  )
}
