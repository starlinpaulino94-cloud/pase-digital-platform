import { requireRole } from '@/lib/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { SentryUserSync } from '@/components/SentryUserSync'
import { getUnreadCount } from '@/modules/notificaciones/actions'

export default async function EmpleadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole(['EMPLEADO', 'ADMIN_EMPRESA', 'SUPERADMIN'])
  const notifCount = await getUnreadCount().catch(() => 0)
  return (
    <AppShell
      role={user.metadata.role}
      title="MembeGo"
      userEmail={user.email}
      notifCount={notifCount}
    >
      <SentryUserSync userId={user.metadata.dbUserId} email={user.email} role={user.metadata.role} companyId={user.metadata.companyId} />
      {children}
    </AppShell>
  )
}
