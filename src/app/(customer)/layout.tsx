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
      <nav className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-6 text-sm overflow-x-auto">
          <Link href="/profile" className="font-semibold text-foreground shrink-0">PASE</Link>
          <Link href="/profile" className="text-muted-foreground hover:text-foreground shrink-0">Perfil</Link>
          <Link href="/profile/pase" className="text-muted-foreground hover:text-foreground shrink-0">Mi Pase</Link>
          <Link href="/profile/promociones" className="text-muted-foreground hover:text-foreground shrink-0">Promociones</Link>
          <Link href="/profile/historial" className="text-muted-foreground hover:text-foreground shrink-0">Historial</Link>
          <Link href="/profile/empresas" className="text-muted-foreground hover:text-foreground shrink-0">Empresas</Link>
          <Link href="/profile/configuracion" className="text-muted-foreground hover:text-foreground shrink-0">Configuración</Link>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
