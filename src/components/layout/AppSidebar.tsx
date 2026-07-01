'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/modules/auth/actions'
import { navForRole, roleLabel, ROLE_ICONS } from '@/components/layout/nav-config'
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
  const RoleIcon = ROLE_ICONS[role]

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <Sparkles className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">
            {title}
          </p>
          <p className="truncate text-[11px] text-sidebar-foreground/60">
            {roleLabel(role)}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-white'
                          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white'
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                      )}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active
                            ? 'text-sidebar-primary'
                            : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
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
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
            <RoleIcon className="h-4 w-4 text-sidebar-foreground/70" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{userEmail}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/50">
              {roleLabel(role)}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition hover:bg-sidebar-accent hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
