import { CompanyGrid } from '@/components/public/CompanyGrid'
import { CategoryTabs } from '@/components/public/CategoryTabs'
import { getCompaniesPublic, getCategoriesPublic } from '@/modules/marketplace/queries'

interface RegistroPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: 'Registrarse - MembeGo',
  description: 'Elige una empresa y regístrate para acceder a membresías y beneficios exclusivos',
}

export default async function RegistroPage({ searchParams }: RegistroPageProps) {
  const params = await searchParams

  const filters = {
    category: typeof params.category === 'string' ? params.category : undefined,
    search: typeof params.search === 'string' ? params.search : undefined,
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
              Elige tu Empresa
            </h1>
            <p className="text-neutral-600 mt-2 text-lg">
              Selecciona una empresa para crear tu membresía y acceder a beneficios exclusivos
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="border-b border-neutral-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CategoryTabs categories={categories} isLoading={false} />
        </div>
      </section>

      {/* Companies Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CompanyGrid
            companies={companies}
            isLoading={false}
            emptyMessage="No se encontraron empresas disponibles"
          />
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900">
            ¿No ves la empresa que buscas?
          </h2>
          <p className="text-neutral-600 mt-2 mb-6">
            Contáctanos y te ayudaremos a encontrar la mejor opción para ti
          </p>
          <a
            href="mailto:contacto@membego.com"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contactar Soporte
          </a>
        </div>
      </section>
    </div>
  )
}
