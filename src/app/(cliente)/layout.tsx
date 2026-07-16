import { requireRole } from '@/lib/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { SentryUserSync } from '@/components/SentryUserSync'
import { getUnreadCount } from '@/modules/notificaciones/actions'
import { getClienteCompanies } from '@/modules/cliente/actions'
import { getMembresiaActivaPrincipalId } from '@/modules/cliente/queries'

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('CLIENTE')
  const [notifCount, clienteCompanies, membresiaQrId] = await Promise.all([
    getUnreadCount().catch(() => 0),
    getClienteCompanies().catch(() => []),
    getMembresiaActivaPrincipalId(user.supabaseId, user.metadata.clienteId),
  ])
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
      // Dock central "Mi QR" de la barra inferior (reemplaza al FAB flotante).
      qrHref={membresiaQrId ? `/membresia/${membresiaQrId}` : null}
    >
      <SentryUserSync userId={user.metadata.dbUserId} email={user.email} role={user.metadata.role} companyId={user.metadata.companyId} />
      {children}
    </AppShell>
  )
}
