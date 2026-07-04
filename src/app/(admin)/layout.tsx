import { requireRole } from '@/lib/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { SentryUserSync } from '@/components/SentryUserSync'
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
      // Resolvemos el menú por el rol real del usuario. Así un SUPERADMIN que
      // entre a una página /admin/* conserva su barra lateral (Superadmin) en
      // vez de quedar "atrapado" en el menú de Administrador. Los roles admin
      // (ADMIN_EMPRESA, GERENTE, etc.) siguen viendo el menú Admin.
      role={user.metadata.role}
      title="MembreGo"
      userEmail={user.email}
      notifCount={notifCount}
    >
      <SentryUserSync userId={user.metadata.dbUserId} email={user.email} role={user.metadata.role} companyId={user.metadata.companyId} />
      {children}
    </AppShell>
  )
}
