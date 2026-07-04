import { requireRole } from '@/lib/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { SentryUserSync } from '@/components/SentryUserSync'
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
      title="MembeGo"
      userEmail={user.email}
      notifCount={notifCount}
      companies={companies}
    >
      <SentryUserSync userId={user.metadata.dbUserId} email={user.email} role={user.metadata.role} companyId={user.metadata.companyId} />
      {children}
    </AppShell>
  )
}
