import type { AppRole, AuthUser } from '@/types/auth'
import { AuthError } from './errors'
import { getCurrentUser } from './session'

/**
 * Asserts an active session exists.
 * Usage: const user = await requireAuth()
 * Throws: UNAUTHORIZED
 */
export async function requireAuth(): Promise<AuthUser> {
  return getCurrentUser()
}

/**
 * Asserts the user has one of the allowed roles.
 * Usage: const user = await requireRole('ADMIN_EMPRESA', 'SUPERADMIN')
 * Throws: UNAUTHORIZED, INVALID_ROLE
 */
export async function requireRole(...roles: AppRole[]): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!roles.includes(user.role)) {
    throw new AuthError('INVALID_ROLE', `Role ${user.role} not in [${roles.join(', ')}]`)
  }
  return user
}

/**
 * Asserts the user is a SUPERADMIN.
 * Throws: UNAUTHORIZED, INVALID_ROLE
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  return requireRole('SUPERADMIN')
}

/**
 * Asserts the user can access the given company.
 * - SUPERADMIN: always allowed.
 * - ADMIN_EMPRESA / EMPLEADO: only if their companyId matches.
 * Throws: UNAUTHORIZED, COMPANY_ACCESS_DENIED
 */
export async function requireCompanyAccess(companyId: string): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (user.role === 'SUPERADMIN') return user

  if (user.role === 'CLIENTE') {
    throw new AuthError('COMPANY_ACCESS_DENIED')
  }

  if (user.companyId !== companyId) {
    throw new AuthError(
      'COMPANY_ACCESS_DENIED',
      `User ${user.supabaseId} attempted access to company ${companyId} but belongs to ${user.companyId}`
    )
  }

  return user
}

/**
 * Asserts the user is an employee (ADMIN_EMPRESA or EMPLEADO) for the given company.
 * Optionally validates branch access for EMPLEADO.
 * Throws: UNAUTHORIZED, COMPANY_ACCESS_DENIED
 */
export async function requireEmployeeAccess(
  companyId: string,
  branchId?: string
): Promise<AuthUser> {
  const user = await requireRole('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO')

  if (user.role === 'SUPERADMIN') return user

  if (user.companyId !== companyId) {
    throw new AuthError('COMPANY_ACCESS_DENIED')
  }

  // For EMPLEADO: if a branchId is required, verify it matches
  if (branchId && user.role === 'EMPLEADO' && user.branchId && user.branchId !== branchId) {
    throw new AuthError(
      'COMPANY_ACCESS_DENIED',
      `Employee ${user.supabaseId} does not belong to branch ${branchId}`
    )
  }

  return user
}

/**
 * Asserts the user can access the given customer's data.
 * - SUPERADMIN: always allowed.
 * - ADMIN_EMPRESA / EMPLEADO: allowed (cross-company validation will be enforced by service layer).
 * - CLIENTE: only if their customerId matches.
 * Throws: UNAUTHORIZED, CUSTOMER_ACCESS_DENIED
 */
export async function requireCustomerAccess(customerId: string): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (user.role === 'SUPERADMIN') return user
  if (user.role === 'ADMIN_EMPRESA' || user.role === 'EMPLEADO') return user

  // CLIENTE can only access their own profile
  if (user.customerId !== customerId) {
    throw new AuthError('CUSTOMER_ACCESS_DENIED')
  }

  return user
}

/**
 * Asserts the user is the customer themselves (strict self-access).
 * Use for sensitive operations like updating personal profile.
 * Throws: UNAUTHORIZED, FORBIDDEN
 */
export async function requireSelfAccess(customerId: string): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (user.role === 'SUPERADMIN') return user

  if (user.role !== 'CLIENTE' || user.customerId !== customerId) {
    throw new AuthError('FORBIDDEN')
  }

  return user
}
