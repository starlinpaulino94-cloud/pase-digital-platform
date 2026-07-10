'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import type { CompanyOption } from '@/components/cliente/CompanySwitcher'
import type { AppRole } from '@/types'

export function AppShell({
  role,
  title,
  userEmail,
  notifCount = 0,
  companies,
  children,
}: {
  role: AppRole
  title: string
  userEmail: string
  notifCount?: number
  companies?: CompanyOption[]
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar — fixed */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <AppSidebar role={role} title={title} userEmail={userEmail} />
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
            'absolute inset-0 bg-slate-900/50 transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
        />
        <aside
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
      <div className="lg:pl-60">
        <AppHeader
          role={role}
          notifCount={notifCount}
          companies={companies}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
