'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import type { CompanyOption } from '@/components/cliente/CompanySwitcher'
import type { AppRole } from '@/types'

/** Roles con navegación inferior en móvil (experiencia principalmente táctil). */
const BOTTOM_NAV_ROLES: readonly AppRole[] = ['CLIENTE']

/** DXS · Persistencia del riel colapsado de la sidebar (desktop). */
const RAIL_KEY = 'membego.sidebar.rail.v1'
const emptySubscribe = () => () => {}

function leerRail(): boolean {
  try {
    return localStorage.getItem(RAIL_KEY) === '1'
  } catch {
    return false
  }
}

export function AppShell({
  role,
  title,
  userEmail,
  notifCount = 0,
  companies,
  qrHref,
  children,
}: {
  role: AppRole
  title: string
  userEmail: string
  notifCount?: number
  companies?: CompanyOption[]
  /** Destino del dock central "Mi QR" en la barra inferior (cliente). */
  qrHref?: string | null
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  const hasBottomNav = BOTTOM_NAV_ROLES.includes(role)

  // DXS · Riel colapsado (desktop): SSR/1er render expandido (sin mismatch de
  // hidratación); tras montar aplica lo guardado. El toggle pisa con override.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [railOverride, setRailOverride] = useState<boolean | null>(null)
  const rail = railOverride ?? (mounted ? leerRail() : false)

  function toggleRail() {
    const next = !rail
    setRailOverride(next)
    try {
      localStorage.setItem(RAIL_KEY, next ? '1' : '0')
    } catch {
      /* sin almacenamiento: el riel funciona sin memoria */
    }
  }

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // A11y del drawer: cerrar con Escape y mover el foco al abrirlo.
  useEffect(() => {
    if (!mobileOpen) return
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar — fija, colapsable a riel de iconos (DXS) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 ease-out lg:block',
          rail ? 'w-[68px]' : 'w-60'
        )}
      >
        <AppSidebar
          role={role}
          title={title}
          userEmail={userEmail}
          rail={rail}
          onToggleRail={toggleRail}
        />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            'absolute inset-0 bg-black/50 transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
        />
        <aside
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className={cn(
            'absolute inset-y-0 left-0 w-64 overflow-hidden rounded-r-2xl elevation-3 transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
          <AppSidebar
            role={role}
            title={title}
            userEmail={userEmail}
            onNavigate={() => setMobileOpen(false)}
          />
        </aside>
      </div>

      {/* Main column */}
      <div
        className={cn(
          'transition-[padding] duration-200 ease-out',
          rail ? 'lg:pl-[68px]' : 'lg:pl-60'
        )}
      >
        <AppHeader
          role={role}
          notifCount={notifCount}
          companies={companies}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main
          className={cn(
            'mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8',
            // Espacio para que la barra inferior no tape el contenido en móvil.
            hasBottomNav && 'pb-24 lg:pb-8'
          )}
        >
          {children}
        </main>
      </div>

      {hasBottomNav && <BottomNav role={role} qrHref={qrHref} />}
    </div>
  )
}
