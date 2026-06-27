export { getSession, getCurrentUser } from './session'
export { AuthError, isAuthError, AUTH_ERROR_CODES } from './errors'
export type { AuthErrorCode } from './errors'
export { can, getPermissionsForRole, isOperator, isEmpresaStaff } from './permissions'
export type { Permission } from './permissions'
export {
  requireAuth,
  requireRole,
  requireSuperAdmin,
  requireCompanyAccess,
  requireEmployeeAccess,
  requireCustomerAccess,
  requireSelfAccess,
} from './guards'
