'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface FilterPanelProps {
  onFiltersChange?: (filters: Record<string, string>) => void
}

export function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    const filtersObj = Object.fromEntries(params)
    onFiltersChange?.(filtersObj)
    router.push(`?${params.toString()}`)
  }

  const handleReset = () => {
    router.push('?')
  }

  const hasActiveFilters = searchParams.toString().length > 0

  return (
    <div>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-full mb-4 bg-neutral-100 text-neutral-900 px-4 py-2 rounded-lg flex items-center justify-between"
      >
        <span>Filtros</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {/* Filter Panel */}
      <div
        className={`md:block ${
          isOpen ? 'block' : 'hidden'
        } space-y-6 md:w-64 md:pr-6`}
      >
        {/* Type Filter */}
        <div>
          <h3 className="font-semibold text-neutral-900 mb-3">Tipo de Empresa</h3>
          <div className="space-y-2">
            {['Comercio', 'Servicio', 'Salud', 'Educación'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={type.toLowerCase()}
                  onChange={(e) =>
                    handleFilterChange('type', e.target.value)
                  }
                  checked={searchParams.get('type') === type.toLowerCase()}
                  className="w-4 h-4"
                />
                <span className="text-neutral-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* City Filter */}
        <div>
          <h3 className="font-semibold text-neutral-900 mb-3">Ciudad</h3>
          <select
            value={searchParams.get('city') || ''}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las ciudades</option>
            <option value="Lima">Lima</option>
            <option value="Arequipa">Arequipa</option>
            <option value="Cusco">Cusco</option>
            <option value="Trujillo">Trujillo</option>
          </select>
        </div>

        {/* Featured Filter */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={searchParams.get('featured') === 'true'}
              onChange={(e) =>
                handleFilterChange('featured', e.target.checked ? 'true' : '')
              }
              className="w-4 h-4"
            />
            <span className="text-neutral-700">Solo destacadas</span>
          </label>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="w-full bg-neutral-100 text-neutral-900 px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  )
}
