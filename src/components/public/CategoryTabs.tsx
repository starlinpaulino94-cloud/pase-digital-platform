'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { CategoryPublic } from '@/modules/marketplace/types'

interface CategoryTabsProps {
  categories: CategoryPublic[]
  isLoading?: boolean
}

export function CategoryTabs({ categories, isLoading = false }: CategoryTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')

  const handleCategoryChange = (slug: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    router.push(`?${params.toString()}`)
  }

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-24 rounded-full bg-neutral-200 animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* All Categories Button */}
      <button
        onClick={() => handleCategoryChange(null)}
        className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
          !activeCategory
            ? 'bg-blue-500 text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        }`}
      >
        Todas
      </button>

      {/* Category Buttons */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryChange(category.slug)}
          className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeCategory === category.slug
              ? 'bg-blue-500 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <span>{category.name}</span>
          {category.companyCount > 0 && (
            <span className="text-xs opacity-75">({category.companyCount})</span>
          )}
        </button>
      ))}
    </div>
  )
}
