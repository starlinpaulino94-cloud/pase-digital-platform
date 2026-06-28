import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AppSidebar } from '@/components/layout/AppSidebar'

export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect('/login')

  const allowed = ['SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO'] as const
  if (!allowed.includes(session.role as (typeof allowed)[number])) {
    redirect('/profile')
  }

  const isAdmin = session.role === 'ADMIN_EMPRESA' || session.role === 'SUPERADMIN'

  const nav = [
    { label: 'Panel', href: '/dashboard' },
    { label: 'Promociones', href: '/dashboard/promociones' },
    { label: 'Clientes', href: '/dashboard/clientes' },
    { label: 'Validaciones', href: '/dashboard/validaciones' },
    { label: 'Sucursales', href: '/dashboard/sucursales' },
    ...(isAdmin
      ? [
          { label: 'Empleados', href: '/dashboard/empleados' },
        ]
      : []),
  ]

  const bottomNav = isAdmin
    ? [{ label: 'Mi empresa', href: '/dashboard/empresa' }]
    : []

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        brand="Panel empresa"
        brandHref="/dashboard"
        items={nav}
        bottomItems={bottomNav}
      />
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
