import { requireRole } from '@/lib/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { getUnreadCount } from '@/modules/notificaciones/actions'
import { getClienteCompanies } from '@/modules/cliente/actions'

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('CLIENTE')
  const notifCount = await getUnreadCount()
  const clienteCompanies = await getClienteCompanies(user.supabaseId)
  const companies = clienteCompanies.map((c) => ({
    companyId: c.companyId,
    name: c.company.name,
    logoUrl: c.company.logoUrl,
    active: c.companyId === user.metadata.companyId,
  }))
  return (
    <AppShell
      role="CLIENTE"
      title="PASE Digital"
      userEmail={user.email}
      notifCount={notifCount}
      companies={companies}
    >
      {children}
    </AppShell>
  )
}
