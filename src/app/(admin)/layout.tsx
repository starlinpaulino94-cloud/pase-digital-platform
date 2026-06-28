import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'SUPERADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6 text-sm overflow-x-auto">
          <Link href="/admin" className="font-semibold text-foreground shrink-0">PASE Admin</Link>
          <Link href="/admin/empresas" className="text-muted-foreground hover:text-foreground shrink-0">Empresas</Link>
          <Link href="/admin/clientes" className="text-muted-foreground hover:text-foreground shrink-0">Clientes</Link>
          <Link href="/admin/empleados" className="text-muted-foreground hover:text-foreground shrink-0">Empleados</Link>
          <Link href="/admin/promociones" className="text-muted-foreground hover:text-foreground shrink-0">Promociones</Link>
          <Link href="/admin/validaciones" className="text-muted-foreground hover:text-foreground shrink-0">Validaciones</Link>
          <Link href="/admin/auditoria" className="text-muted-foreground hover:text-foreground shrink-0">Auditoría</Link>
          <Link href="/admin/configuracion" className="text-muted-foreground hover:text-foreground shrink-0">Configuración</Link>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
