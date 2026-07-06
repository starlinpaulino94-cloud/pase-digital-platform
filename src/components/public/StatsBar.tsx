import type { CompanyStats } from '@/modules/marketplace/types'

interface StatsBarProps {
  stats: CompanyStats
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="rounded-lg bg-blue-50 p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">
          {stats.totalMembers}
        </div>
        <div className="text-sm text-neutral-600">Miembros Activos</div>
      </div>

      <div className="rounded-lg bg-green-50 p-4 text-center">
        <div className="text-2xl font-bold text-green-600">
          {stats.activePromotions}
        </div>
        <div className="text-sm text-neutral-600">Promociones Vigentes</div>
      </div>

      <div className="rounded-lg bg-yellow-50 p-4 text-center">
        <div className="text-2xl font-bold text-yellow-600">
          {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
        </div>
        <div className="text-sm text-neutral-600">Rating Promedio</div>
      </div>

      <div className="rounded-lg bg-purple-50 p-4 text-center">
        <div className="text-2xl font-bold text-purple-600">
          {stats.totalRatings}
        </div>
        <div className="text-sm text-neutral-600">Valoraciones</div>
      </div>
    </div>
  )
}
