import { requireRole } from '@/lib/auth/guards'
import { AppNav } from '@/components/layout/AppNav'

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole('SUPERADMIN')
  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav
        title="PASE · Superadmin"
        items={[
          { href: '/superadmin/dashboard', label: 'Resumen' },
          { href: '/superadmin/empresas', label: 'Empresas' },
          { href: '/superadmin/reportes', label: 'Reportes' },
          { href: '/admin/clientes', label: 'Clientes' },
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
