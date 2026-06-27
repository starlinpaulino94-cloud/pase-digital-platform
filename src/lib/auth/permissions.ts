import type { AppRole, AuthUser } from '@/types/auth'

// All permissions available in the system.
// Each permission answers a "can this user do X?" question.
export type Permission =
  | 'platform:manage'       // manage the PASE platform itself (SUPERADMIN)
  | 'company:list_all'      // list all companies (SUPERADMIN)
  | 'company:manage'        // manage a company's settings/data
  | 'branch:manage'         // manage branches of a company
  | 'employees:manage'      // invite/edit/deactivate employees
  | 'customers:view'        // view customer list and profiles
  | 'promotions:manage'     // create/edit/deactivate promotions
  | 'promotions:view'       // view active promotions
  | 'assignments:manage'    // create/cancel promotion assignments
  | 'qr:scan'               // scan a customer QR code
  | 'validation:confirm'    // confirm (consume) a scanned validation
  | 'reports:view'          // view usage/revenue reports
  | 'pass:view_own'         // view own digital pass (CLIENTE)
  | 'promotions:view_own'   // view own promotion assignments (CLIENTE)
  | 'history:view_own'      // view own validation history (CLIENTE)

// Declarative permission matrix — single source of truth.
// If a permission needs runtime context (e.g. companyId match), use guards
// in addition to this static check.
const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  SUPERADMIN: [
    'platform:manage',
    'company:list_all',
    'company:manage',
    'branch:manage',
    'employees:manage',
    'customers:view',
    'promotions:manage',
    'promotions:view',
    'assignments:manage',
    'qr:scan',
    'validation:confirm',
    'reports:view',
  ],
  ADMIN_EMPRESA: [
    'company:manage',
    'branch:manage',
    'employees:manage',
    'customers:view',
    'promotions:manage',
    'promotions:view',
    'assignments:manage',
    'qr:scan',
    'validation:confirm',
    'reports:view',
  ],
  EMPLEADO: [
    'customers:view',
    'promotions:view',
    'qr:scan',
    'validation:confirm',
  ],
  CLIENTE: [
    'pass:view_own',
    'promotions:view_own',
    'history:view_own',
  ],
}

/**
 * Returns true if the user's role grants the requested permission.
 * For company-scoped checks, combine this with requireCompanyAccess().
 */
export function can(user: AuthUser, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
}

/**
 * Returns all permissions for a given role.
 */
export function getPermissionsForRole(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

/**
 * Returns true if the role is an operator (can interact with the empresa panel).
 */
export function isOperator(role: AppRole): boolean {
  return role === 'SUPERADMIN' || role === 'ADMIN_EMPRESA' || role === 'EMPLEADO'
}

/**
 * Returns true if the role belongs to empresa staff (not superadmin, not cliente).
 */
export function isEmpresaStaff(role: AppRole): boolean {
  return role === 'ADMIN_EMPRESA' || role === 'EMPLEADO'
}
