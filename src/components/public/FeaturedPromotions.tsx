import { PromotionGrid } from './PromotionGrid'
import Link from 'next/link'
import type { PromotionPublic } from '@/modules/marketplace/types'

interface FeaturedPromotionsProps {
  promotions: PromotionPublic[]
  isLoading?: boolean
}

export function FeaturedPromotions({
  promotions,
  isLoading = false,
}: FeaturedPromotionsProps) {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
              Promociones Destacadas
            </h2>
            <p className="text-neutral-600 mt-2">
              Las mejores ofertas seleccionadas para ti
            </p>
          </div>
          <Link
            href="/promociones"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Ver todas →
          </Link>
        </div>

        {/* Grid */}
        <PromotionGrid
          promotions={promotions}
          isLoading={isLoading}
          variant="default"
        />
      </div>
    </section>
  )
}
