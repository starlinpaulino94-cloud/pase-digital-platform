'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/modules/auth/actions'
import { Logo } from '@/components/layout/Logo'
import { navForRole, roleLabel } from '@/components/layout/nav-config'
import type { AppRole } from '@/types'

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function AppSidebar({
  role,
  title,
  userEmail,
  onNavigate,
}: {
  role: AppRole
  title: string
  userEmail: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const groups = navForRole(role)
  const inicial = (userEmail[0] ?? 'U').toUpperCase()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
        <Logo size={28} className="rounded-lg" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold tracking-tight text-white">
            {title}
          </p>
          <p className="truncate text-[10px] uppercase tracking-wider text-sidebar-foreground/45">
            {roleLabel(role)}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-4 pt-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/35">
              {group.label}
            </p>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      // Sin prefetch: con 9-26 links por rol sobre rutas
                      // force-dynamic, cada prefetch dispara middleware +
                      // queries; multiplicaba por ~10 las llamadas de auth.
                      prefetch={false}
                      onClick={onNavigate}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-150',
                        active
                          ? 'bg-white/[0.08] text-white'
                          : 'text-sidebar-foreground/70 hover:bg-white/[0.05] hover:text-white'
                      )}
                    >
                      {active && (
                        <span className="absolute -left-2.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                      )}
                      <Icon
                        className={cn(
                          'h-[15px] w-[15px] shrink-0 transition-colors duration-150',
                          active
                            ? 'text-sidebar-primary'
                            : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-sidebar-border/60 p-2.5">
        <div className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-semibold text-white">
            {inicial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{userEmail}</p>
            <p className="truncate text-[10px] text-sidebar-foreground/45">
              {roleLabel(role)}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
