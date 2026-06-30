import { requireRole } from '@/lib/auth/guards'
import { AppNav } from '@/components/layout/AppNav'

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole('CLIENTE')
  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav
        title="PASE Digital"
        items={[
          { href: '/cliente/dashboard', label: 'Mi panel' },
          { href: '/cliente/planes', label: 'Oportunidades' },
          { href: '/cliente/membresia', label: 'Mi membresía' },
          { href: '/cliente/historial', label: 'Historial' },
          { href: '/cliente/pagos', label: 'Mis pagos' },
        ]}
      />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  )
}
