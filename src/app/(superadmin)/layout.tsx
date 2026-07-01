import { requireRole } from '@/lib/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { getUnreadCount } from '@/modules/notificaciones/actions'

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('SUPERADMIN')
  const notifCount = await getUnreadCount()
  return (
    <AppShell
      role="SUPERADMIN"
      title="PASE Digital"
      userEmail={user.email}
      notifCount={notifCount}
    >
      {children}
    </AppShell>
  )
}
