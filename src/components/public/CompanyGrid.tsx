import type { CompanyPublic } from '@/modules/marketplace/types'
import { CompanyCard } from './CompanyCard'

interface CompanyGridProps {
  companies: CompanyPublic[]
  isLoading?: boolean
  emptyMessage?: string
  /** Base de la ruta del perfil (se propaga a cada CompanyCard). */
  hrefBase?: string
}

export function CompanyGrid({
  companies,
  isLoading = false,
  emptyMessage = 'No se encontraron empresas',
  hrefBase,
}: CompanyGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-lg bg-neutral-200 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-500 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} hrefBase={hrefBase} />
      ))}
    </div>
  )
}
