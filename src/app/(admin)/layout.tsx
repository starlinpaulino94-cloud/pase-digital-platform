import { requireRole } from '@/lib/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { ADMIN_ROLES } from '@/types'
import { getUnreadCount } from '@/modules/notificaciones/actions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole(ADMIN_ROLES)
  const notifCount = await getUnreadCount()
  return (
    <AppShell
      role="ADMIN_EMPRESA"
      title="PASE Digital"
      userEmail={user.email}
      notifCount={notifCount}
    >
      {children}
    </AppShell>
  )
}
