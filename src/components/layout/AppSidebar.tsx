'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
}

interface AppSidebarProps {
  brand: string
  brandHref?: string
  items: NavItem[]
  bottomItems?: NavItem[]
  footer?: React.ReactNode
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
      )}
    >
      {item.icon && (
        <span className={cn('shrink-0 opacity-70 group-hover:opacity-100', active && 'opacity-100')}>
          {item.icon}
        </span>
      )}
      <span className="truncate">{item.label}</span>
      {item.badge !== undefined && (
        <span className="ml-auto text-xs font-medium tabular-nums bg-sidebar-accent text-sidebar-accent-foreground px-1.5 py-0.5 rounded-md">
          {item.badge}
        </span>
      )}
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary shrink-0" />
      )}
    </Link>
  )
}

export function AppSidebar({ brand, brandHref = '/', items, bottomItems, footer }: AppSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border shrink-0">
        <Link
          href={brandHref}
          className="flex items-center gap-2 text-sidebar-accent-foreground font-semibold text-sm tracking-tight hover:opacity-90 transition-opacity"
        >
          <div className="w-6 h-6 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">P</span>
          </div>
          {brand}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom items */}
      {bottomItems && bottomItems.length > 0 && (
        <div className="py-3 px-2 border-t border-sidebar-border space-y-0.5">
          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      )}

      {/* Footer slot */}
      {footer && (
        <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
          {footer}
        </div>
      )}
    </aside>
  )
}
