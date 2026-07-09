'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/empresas', label: 'Explorar empresas' },
  { href: '/promociones', label: 'Promociones' },
  { href: '/registro-empresa', label: 'Para empresas' },
]

export function PublicNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Efecto sticky premium: al hacer scroll la barra flotante gana sombra y
  // fondo más sólido (estilo Stripe / Linear).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:pt-4">
      <nav
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300 sm:px-5',
          scrolled
            ? 'border-slate-200/80 bg-white/80 shadow-premium glass-strong'
            : 'border-transparent bg-white/40 glass'
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="MembeGo" width={30} height={30} priority />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Membe<span className="text-emerald-500">Go</span>
          </span>
        </Link>

        {/* Menú centrado (desktop) */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                isActive(l.href)
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTAs (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Ingresar
          </Link>
          <Link
            href="/empresas"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:bg-blue-700 hover:shadow-glow-strong active:scale-[0.98]"
          >
            Empezar
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Toggle móvil */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-900/5 md:hidden"
          aria-label="Menú"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Menú móvil */}
      {open && (
        <div className="mx-auto mt-2 max-w-6xl animate-scale-in rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-premium glass-strong md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-1 space-y-1.5 border-t border-slate-200/70 pt-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5"
            >
              Ingresar
            </Link>
            <Link
              href="/empresas"
              onClick={() => setOpen(false)}
              className="block rounded-xl bg-blue-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-glow"
            >
              Empezar
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
