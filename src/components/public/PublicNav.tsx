'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function PublicNav() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl text-blue-600">
            MembeGo
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/empresas"
              className={`transition-colors ${
                isActive('/empresas')
                  ? 'text-blue-600 font-semibold'
                  : 'text-neutral-700 hover:text-blue-600'
              }`}
            >
              Explorar Empresas
            </Link>
            <Link
              href="/promociones"
              className={`transition-colors ${
                isActive('/promociones')
                  ? 'text-blue-600 font-semibold'
                  : 'text-neutral-700 hover:text-blue-600'
              }`}
            >
              Promociones
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-neutral-700 hover:text-blue-600 transition-colors"
            >
              Ingresar
            </Link>
            <Link
              href="/registro"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Registrarse
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 py-4 space-y-4">
            <Link
              href="/empresas"
              className="block text-neutral-700 hover:text-blue-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Explorar Empresas
            </Link>
            <Link
              href="/promociones"
              className="block text-neutral-700 hover:text-blue-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Promociones
            </Link>
            <div className="border-t border-neutral-200 pt-4 space-y-2">
              <Link
                href="/login"
                className="block text-neutral-700 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Registrarse
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
