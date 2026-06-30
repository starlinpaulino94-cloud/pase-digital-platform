'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { logout } from '@/modules/auth/actions'
import { NotificationBell } from '@/components/layout/NotificationBell'

export interface NavItem {
  href: string
  label: string
}

export function AppNav({
  items,
  title,
  notifCount = 0,
}: {
  items: NavItem[]
  title: string
  notifCount?: number
}) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-white/80 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-slate-900 tracking-tight"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:block">{title}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden gap-0.5 md:flex">
            {items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'text-sky-600'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-[9px] h-0.5 rounded-full bg-sky-500" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side: bell + logout */}
        <div className="flex items-center gap-1">
          <NotificationBell initialCount={notifCount} />
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile scrollable nav */}
      <nav className="flex gap-0.5 overflow-x-auto border-t border-border/40 px-3 py-1.5 md:hidden">
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sky-50 text-sky-600'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
