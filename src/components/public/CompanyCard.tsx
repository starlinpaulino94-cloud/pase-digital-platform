import Link from 'next/link'
import Image from 'next/image'
import type { CompanyPublic } from '@/modules/marketplace/types'

interface CompanyCardProps {
  company: CompanyPublic
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/empresas/${company.slug}`}>
      <div className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all duration-300 hover:shadow-lg hover:border-blue-300">
        {/* Banner Image */}
        {company.bannerUrl && (
          <div className="relative h-32 w-full overflow-hidden bg-neutral-100">
            <Image
              src={company.bannerUrl}
              alt={company.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        {/* Logo Area */}
        <div className="relative -mt-8 flex justify-center px-4">
          {company.logoUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-white shadow-md">
              <Image
                src={company.logoUrl}
                alt={company.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full border-4 border-white bg-neutral-200" />
          )}
        </div>

        {/* Content */}
        <div className="space-y-2 px-4 py-3 text-center">
          <h3 className="font-semibold text-neutral-900 line-clamp-1">
            {company.name}
          </h3>

          {company.ciudad && (
            <p className="text-sm text-neutral-500">
              {company.ciudad}
              {company.pais && `, ${company.pais}`}
            </p>
          )}

          {company.description && (
            <p className="text-xs text-neutral-600 line-clamp-2">
              {company.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex justify-around border-t border-neutral-100 pt-3 text-xs">
            <div>
              <div className="font-semibold text-neutral-900">
                {company.activePromotionsCount}
              </div>
              <div className="text-neutral-500">Promociones</div>
            </div>
            <div>
              <div className="font-semibold text-neutral-900">
                {company.totalMembersCount}
              </div>
              <div className="text-neutral-500">Miembros</div>
            </div>
            {company.averageRating && (
              <div>
                <div className="font-semibold text-neutral-900">
                  {company.averageRating.toFixed(1)}
                </div>
                <div className="text-neutral-500">⭐ Rating</div>
              </div>
            )}
          </div>
        </div>

        {/* Featured Badge */}
        {company.isFeatured && (
          <div className="absolute top-2 right-2 rounded-full bg-blue-500 text-white px-2 py-1 text-xs font-semibold">
            Destacada
          </div>
        )}
      </div>
    </Link>
  )
}
