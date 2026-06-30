import { requireRole } from '@/lib/auth/guards'
import { AppNav } from '@/components/layout/AppNav'
import { ADMIN_ROLES } from '@/types'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(ADMIN_ROLES)
  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav
        title="PASE · Admin"
        items={[
          { href: '/admin/dashboard', label: 'Resumen' },
          { href: '/admin/clientes', label: 'Clientes' },
          { href: '/admin/membresias', label: 'Membresías' },
          { href: '/admin/pagos', label: 'Pagos' },
          { href: '/admin/planes', label: 'Planes' },
          { href: '/admin/empleados', label: 'Empleados' },
          { href: '/admin/reportes', label: 'Reportes' },
          { href: '/empleado/scanner', label: 'Escáner' },
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
