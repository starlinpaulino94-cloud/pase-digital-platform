'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
}

export function SearchBar({
  placeholder = 'Buscar empresas, promociones...',
  onSearch,
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (onSearch) {
        onSearch(query)
      } else {
        const params = new URLSearchParams(searchParams)
        if (query.trim()) {
          params.set('search', query)
        } else {
          params.delete('search')
        }
        router.push(`?${params.toString()}`)
      }
    },
    [query, searchParams, router, onSearch]
  )

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border-0 bg-white py-3.5 pl-12 pr-24 text-[15px] text-slate-900 shadow-premium-lg outline-none transition-shadow placeholder:text-slate-400 focus:ring-2 focus:ring-sky-300"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
        >
          Buscar
        </button>
      </div>
    </form>
  )
}
