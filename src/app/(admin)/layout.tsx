import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AppSidebar } from '@/components/layout/AppSidebar'

const NAV = [
  { label: 'Panel', href: '/admin' },
  { label: 'Empresas', href: '/admin/empresas' },
  { label: 'Clientes', href: '/admin/clientes' },
  { label: 'Empleados', href: '/admin/empleados' },
  { label: 'Promociones', href: '/admin/promociones' },
  { label: 'Validaciones', href: '/admin/validaciones' },
  { label: 'Auditoría', href: '/admin/auditoria' },
  { label: 'Reportes', href: '/admin/reportes' },
]

const BOTTOM_NAV = [
  { label: 'Configuración', href: '/admin/configuracion' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'SUPERADMIN') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        brand="PASE Admin"
        brandHref="/admin"
        items={NAV}
        bottomItems={BOTTOM_NAV}
      />
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
