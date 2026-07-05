import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import type { AppMetadata, AppRole, SessionUser } from '@/types'

function setSentryContext(user: SessionUser) {
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.setUser({ id: user.metadata.dbUserId || user.supabaseId, email: user.email })
      Sentry.setTag('user.role', user.metadata.role)
      if (user.metadata.companyId) Sentry.setTag('company.id', user.metadata.companyId)
    })
    .catch(() => {})
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const meta = (session.user.app_metadata ?? {}) as Partial<AppMetadata>
  const user: SessionUser = {
    supabaseId: session.user.id,
    email: session.user.email ?? '',
    metadata: {
      role: meta.role ?? 'CLIENTE',
      dbUserId: meta.dbUserId ?? '',
      clienteId: meta.clienteId ?? null,
      companyId: meta.companyId ?? null,
    },
  }
  setSentryContext(user)
  return user
}

export async function requireRole(
  roles: AppRole | AppRole[]
): Promise<SessionUser> {
  const user = await requireUser()
  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!allowed.includes(user.metadata.role)) {
    redirect('/login')
  }
  return user
}
