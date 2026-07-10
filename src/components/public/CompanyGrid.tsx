import Link from 'next/link'
import { Building2 } from 'lucide-react'
import type { CompanyPublic } from '@/modules/marketplace/types'
import { CompanyCard } from './CompanyCard'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} className="h-64" />
        ))}
      </div>
    )
  }

  if (!companies || companies.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-7 w-7" />}
        title={emptyMessage}
        description="Prueba con otra búsqueda o explora todas las categorías disponibles."
        action={
          <Button asChild variant="outline">
            <Link href="/empresas">Ver todas las empresas</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} hrefBase={hrefBase} />
      ))}
    </div>
  )
}
