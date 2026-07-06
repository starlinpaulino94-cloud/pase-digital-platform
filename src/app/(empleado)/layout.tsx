import { requireRole } from '@/lib/auth/guards'
import { AppShell } from '@/components/layout/AppShell'
import { SentryUserSync } from '@/components/SentryUserSync'
import { getUnreadCount } from '@/modules/notificaciones/actions'
import { SCANNER_ROLES } from '@/types'

export default async function EmpleadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Alineado con el proxy edge y la página del scanner (SCANNER_ROLES). Antes
  // usaba una lista que excluía RECEPCION/ADMINISTRADOR/GERENTE/CAJERO, lo que
  // provocaba un bucle de redirección para RECEPCION (su home es el scanner).
  const user = await requireRole(SCANNER_ROLES)
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
