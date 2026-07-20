'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/modules/auth/actions'
import { Logo } from '@/components/layout/Logo'
import { navForRole, filtrarNavOculto, roleLabel, allLinks, type NavGroup } from '@/components/layout/nav-config'
import type { AppRole } from '@/types'

/** Clave de persistencia del estado colapsado (ids de grupo, por rol). */
const STORAGE_KEY = 'membego.nav.collapsed.v1'

const emptySubscribe = () => () => {}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

function groupHasActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isActive(pathname, item.href))
}

function loadCollapsed(role: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as Record<string, string[]>
    return new Set(parsed[role] ?? [])
  } catch {
    return new Set()
  }
}

function saveCollapsed(role: string, collapsed: Set<string>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
    parsed[role] = Array.from(collapsed)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    /* almacenamiento no disponible: el menú funciona sin persistencia */
  }
}

export function AppSidebar({
  role,
  title,
  userEmail,
  onNavigate,
  rail = false,
  onToggleRail,
  hiddenNav,
}: {
  role: AppRole
  title: string
  userEmail: string
  onNavigate?: () => void
  /** DXS · Modo riel: solo iconos con tooltip (desktop colapsado). */
  rail?: boolean
  /** Presente solo en desktop: muestra el botón de colapsar/expandir. */
  onToggleRail?: () => void
  /** Rutas a ocultar por no tener contenido todavía (cliente). */
  hiddenNav?: string[]
}) {
  const pathname = usePathname()
  const groups = filtrarNavOculto(navForRole(role), hiddenNav ?? [])
  const inicial = (userEmail[0] ?? 'U').toUpperCase()

  // Estado colapsado por grupo. En SSR y primer render todo va expandido
  // (mounted=false ⇒ sin mismatch de hidratación); tras montar se lee lo
  // guardado. Los toggles del usuario pisan lo cargado vía `override`.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const [override, setOverride] = useState<Set<string> | null>(null)
  const stored = useMemo(
    () => (mounted ? loadCollapsed(role) : new Set<string>()),
    [mounted, role]
  )
  const collapsed = override ?? stored

  function toggleGroup(id: string) {
    const next = new Set(collapsed)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    saveCollapsed(role, next)
    setOverride(next)
  }

  // ── DXS · Modo riel: iconos con tooltip; máximo espacio para el contenido ──
  if (rail) {
    const links = allLinks(groups)
    return (
      <div className="flex h-full flex-col items-center bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 w-full shrink-0 items-center justify-center border-b border-sidebar-border/50">
          <Logo size={28} className="rounded-lg" />
        </div>
        {onToggleRail && (
          <button
            type="button"
            onClick={onToggleRail}
            title="Expandir menú"
            aria-label="Expandir menú"
            className="mt-2 flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        <nav className="mt-1 flex-1 overflow-y-auto px-2 pb-3">
          <ul className="space-y-1">
            {links.map((item) => {
              const active = isActive(pathname, item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    onClick={onNavigate}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150',
                      active
                        ? 'bg-white/[0.08] text-sidebar-primary'
                        : 'text-sidebar-foreground/55 hover:bg-white/[0.05] hover:text-white'
                    )}
                  >
                    {active && (
                      <span className="absolute -left-2 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                    )}
                    <Icon className="h-[17px] w-[17px]" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="w-full shrink-0 border-t border-sidebar-border/60 py-2.5">
          <div className="flex flex-col items-center gap-1.5">
            <div
              title={userEmail}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-semibold text-white"
            >
              {inicial}
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

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border/50 px-4">
        <Logo size={28} className="rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold tracking-tight text-white">
            {title}
          </p>
          <p className="truncate text-[10px] uppercase tracking-wider text-sidebar-foreground/45">
            {roleLabel(role)}
          </p>
        </div>
        {onToggleRail && (
          <button
            type="button"
            onClick={onToggleRail}
            title="Colapsar menú"
            aria-label="Colapsar menú"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/40 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-4 pt-3">
        {groups.map((group, gi) => {
          const hasActive = groupHasActive(pathname, group)
          // El grupo del módulo activo siempre se muestra abierto (aunque el
          // usuario lo haya colapsado antes): el contexto nunca se esconde.
          const isOpen = hasActive || !collapsed.has(group.id)
          const single = group.items.length === 1

          return (
            <div key={group.id} className={cn('mb-1', gi > 0 && 'mt-2')}>
              {/* Cabecera del grupo: los grupos de un solo ítem no colapsan. */}
              {single ? (
                gi > 0 && (
                  <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/35">
                    {group.label}
                  </p>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  aria-controls={`nav-group-${group.id}`}
                  className={cn(
                    'group/header mb-0.5 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150',
                    hasActive
                      ? 'text-sidebar-primary'
                      : 'text-sidebar-foreground/35 hover:text-sidebar-foreground/70'
                  )}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 shrink-0 transition-transform duration-200',
                      !isOpen && '-rotate-90',
                      hasActive
                        ? 'text-sidebar-primary/70'
                        : 'text-sidebar-foreground/25 group-hover/header:text-sidebar-foreground/60'
                    )}
                  />
                </button>
              )}

              {/* Ítems (colapso animado con grid-rows) */}
              <div
                id={`nav-group-${group.id}`}
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <ul className="min-h-0 space-y-px overflow-hidden">
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
                          aria-current={active ? 'page' : undefined}
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
            </div>
          )
        })}
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
