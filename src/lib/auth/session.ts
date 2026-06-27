import { createClient } from '@/lib/supabase/server'
import type { AuthUser, AppMetadata } from '@/types/auth'
import { AuthError } from './errors'

/**
 * Returns the current authenticated user from the Supabase JWT,
 * or null if there is no active session.
 *
 * Role and company context are read from app_metadata — set by the
 * backend (service role) when creating or updating users. Never trust
 * user_metadata for access control decisions.
 */
export async function getSession(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user || !user.email) return null

    const meta = (user.app_metadata ?? {}) as Partial<AppMetadata>

    return {
      supabaseId: user.id,
      email: user.email,
      role: meta.role ?? 'CLIENTE',
      dbUserId: meta.dbUserId,
      companyId: meta.companyId,
      branchId: meta.branchId,
      customerId: meta.customerId,
    }
  } catch {
    return null
  }
}

/**
 * Returns the current authenticated user.
 * Throws UNAUTHORIZED if there is no active session.
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const session = await getSession()
  if (!session) throw new AuthError('UNAUTHORIZED')
  return session
}
