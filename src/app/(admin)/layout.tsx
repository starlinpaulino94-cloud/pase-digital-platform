import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/layout/AppShell'
import { AdminCompanySwitcher } from '@/components/admin/AdminCompanySwitcher'
import { SentryUserSync } from '@/components/SentryUserSync'
import { ADMIN_ROLES } from '@/types'
import { getUnreadCount } from '@/modules/notificaciones/actions'

/**
 * Empresas entre las que este usuario puede cambiar: superadmin ve todas;
 * el staff multi-empresa ve su empresa actual + las de UserCompanyAccess.
 * Con 0-1 opciones el selector no se muestra (caso común).
 */
async function empresasDisponibles(
  role: string,
  dbUserId: string,
  companyId: string | null
) {
  try {
    if (role === 'SUPERADMIN') {
      return await prisma.company.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      })
    }
    const accesos = await prisma.userCompanyAccess.findMany({
      where: { userId: dbUserId },
      select: { company: { select: { id: true, name: true } } },
    })
    const mapa = new Map(accesos.map((a) => [a.company.id, a.company]))
    if (companyId && !mapa.has(companyId)) {
      const propia = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true },
      })
      if (propia) mapa.set(propia.id, propia)
    }
    return [...mapa.values()].sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole(ADMIN_ROLES)
  const [notifCount, empresas] = await Promise.all([
    getUnreadCount().catch(() => 0),
    empresasDisponibles(
      user.metadata.role,
      user.metadata.dbUserId,
      user.metadata.companyId ?? null
    ),
  ])
  return (
    <AppShell
      // Resolvemos el menú por el rol real del usuario. Así un SUPERADMIN que
      // entre a una página /admin/* conserva su barra lateral (Superadmin) en
      // vez de quedar "atrapado" en el menú de Administrador. Los roles admin
      // (ADMIN_EMPRESA, GERENTE, etc.) siguen viendo el menú Admin.
      role={user.metadata.role}
      title="MembeGo"
      userEmail={user.email}
      notifCount={notifCount}
    >
      <SentryUserSync userId={user.metadata.dbUserId} email={user.email} role={user.metadata.role} companyId={user.metadata.companyId} />
      <AdminCompanySwitcher
        empresas={empresas}
        activaId={user.metadata.companyId ?? null}
      />
      {children}
    </AppShell>
  )
}
