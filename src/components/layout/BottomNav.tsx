'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Compass, Megaphone, Gift, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Prefijos extra que también marcan este ítem como activo. */
  match?: string[]
}

/** Navegación inferior del cliente en móvil (5 destinos curados). */
const CLIENTE_ITEMS: BottomNavItem[] = [
  { href: '/mis-membresias', label: 'Inicio', icon: LayoutDashboard, match: ['/cliente/dashboard', '/membresia'] },
  { href: '/cliente/explorar', label: 'Explorar', icon: Compass, match: ['/cliente/empresas'] },
  { href: '/cliente/promociones', label: 'Ofertas', icon: Megaphone },
  { href: '/cliente/referidos', label: 'Referidos', icon: Gift },
  { href: '/cliente/perfil', label: 'Perfil', icon: User, match: ['/cliente/pagos', '/cliente/historial', '/cliente/ayuda'] },
]

const ITEMS_BY_ROLE: Record<string, BottomNavItem[]> = {
  CLIENTE: CLIENTE_ITEMS,
}

function isActive(pathname: string, item: BottomNavItem) {
  if (pathname === item.href || pathname.startsWith(item.href + '/')) return true
  return (item.match ?? []).some((m) => pathname === m || pathname.startsWith(m + '/'))
}

/**
 * Barra de navegación inferior fija, solo en móvil (oculta en lg+). Da acceso
 * con una mano a los destinos clave; el resto sigue en el drawer del sidebar.
 */
export function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const items = ITEMS_BY_ROLE[role]
  if (!items) return null

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
