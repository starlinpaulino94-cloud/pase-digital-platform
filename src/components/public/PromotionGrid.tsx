import type { PromotionPublic } from '@/modules/marketplace/types'
import { PromotionCard } from './PromotionCard'

interface PromotionGridProps {
  promotions: PromotionPublic[]
  isLoading?: boolean
  variant?: 'default' | 'compact'
  emptyMessage?: string
}

export function PromotionGrid({
  promotions,
  isLoading = false,
  variant = 'default',
  emptyMessage = 'No se encontraron promociones',
}: PromotionGridProps) {
  if (isLoading) {
    const cols = variant === 'compact' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    return (
      <div className={`grid ${cols} gap-4`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`${
              variant === 'compact' ? 'h-32' : 'h-96'
            } rounded-lg bg-neutral-200 animate-pulse`}
          />
        ))}
      </div>
    )
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-500 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  const cols = variant === 'compact' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={`grid ${cols} gap-4`}>
      {promotions.map((promotion) => (
        <PromotionCard
          key={promotion.id}
          promotion={promotion}
          variant={variant}
        />
      ))}
    </div>
  )
}
