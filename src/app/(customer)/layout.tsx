import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect('/login')

  const allowed = ['SUPERADMIN', 'CLIENTE'] as const
  if (!allowed.includes(session.role as (typeof allowed)[number])) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/profile" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">P</span>
            </div>
            <span className="font-semibold text-sm text-foreground">PASE Digital</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {[
              { label: 'Mi Pase', href: '/profile/pase' },
              { label: 'Promociones', href: '/profile/promociones' },
              { label: 'Historial', href: '/profile/historial' },
              { label: 'Empresas', href: '/profile/empresas' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/profile/configuracion"
            className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Perfil
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
