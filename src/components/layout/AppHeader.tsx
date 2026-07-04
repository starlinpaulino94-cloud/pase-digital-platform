'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, ChevronRight, X } from 'lucide-react'
import { navForRole, allLinks } from '@/components/layout/nav-config'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { CompanySwitcher, type CompanyOption } from '@/components/cliente/CompanySwitcher'
import type { AppRole } from '@/types'

export function AppHeader({
  role,
  notifCount = 0,
  companies,
  onMenuClick,
}: {
  role: AppRole
  notifCount?: number
  companies?: CompanyOption[]
  onMenuClick: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const links = useMemo(() => allLinks(navForRole(role)), [role])

  // Resolve current page for breadcrumb
  const current = useMemo(() => {
    const matches = links
      .filter((l) => pathname === l.href || pathname.startsWith(l.href + '/'))
      .sort((a, b) => b.href.length - a.href.length)
    return matches[0] ?? null
  }, [links, pathname])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return links.filter((l) => l.label.toLowerCase().includes(q)).slice(0, 6)
  }, [links, query])

  function go(href: string) {
    setQuery('')
    setOpen(false)
    router.push(href)
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-white/80 px-4 glass md:px-6">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <div className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
        <span className="flex items-center gap-1.5 text-slate-400">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={20} height={20} />
          MembeGo
        </span>
        {current && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="truncate font-medium text-slate-900">
              {current.label}
            </span>
          </>
        )}
      </div>

      {/* Global search */}
      <div className="relative ml-auto w-full max-w-xs md:mx-auto md:ml-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Buscar módulo..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {results.map((r) => {
              const Icon = r.icon
              return (
                <button
                  key={r.href}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(r.href)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  {r.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1">
        {companies && <CompanySwitcher companies={companies} />}
        <NotificationBell initialCount={notifCount} />
      </div>
    </header>
  )
}

export type { CompanyOption }
