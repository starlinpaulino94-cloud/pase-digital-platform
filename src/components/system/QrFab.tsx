'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { QrCode } from 'lucide-react'

/**
 * FAB "Mi QR": botón flotante que deja el código de acceso SIEMPRE a un
 * toque (patrón del mockup Google Studio / Apple Wallet). Vive sobre el
 * bottom nav en móvil y en la esquina inferior derecha en desktop.
 * Se oculta en el detalle de membresía (el QR ya está en pantalla).
 */
export function QrFab({ href }: { href: string }) {
  const pathname = usePathname()
  if (pathname.startsWith('/membresia/')) return null

  return (
    <Link
      href={href}
      aria-label="Ver mi código QR de acceso"
      className="fixed bottom-20 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-white shadow-glow-strong transition-all hover:scale-105 active:scale-95 lg:bottom-8 lg:right-8"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <QrCode className="h-5 w-5" aria-hidden />
      Mi QR
    </Link>
  )
}
