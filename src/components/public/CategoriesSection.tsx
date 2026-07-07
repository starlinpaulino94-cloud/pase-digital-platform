import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { CategoryPublic } from '@/modules/marketplace/types'

interface CategoriesSectionProps {
  categories: CategoryPublic[]
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (categories.length === 0) return null

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Explora por categoría
            </h2>
            <p className="mt-2 text-slate-600">
              Encuentra el tipo de negocio que buscas.
            </p>
          </div>
          <Link
            href="/empresas"
            className="hidden items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:inline-flex"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/empresas?category=${c.slug}`}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
            >
              <span className="font-medium text-slate-800 group-hover:text-blue-700">
                {c.name}
              </span>
              {c.companyCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                  {c.companyCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
