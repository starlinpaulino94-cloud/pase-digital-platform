export const AUTH_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_ROLE: 'INVALID_ROLE',
  COMPANY_ACCESS_DENIED: 'COMPANY_ACCESS_DENIED',
  CUSTOMER_ACCESS_DENIED: 'CUSTOMER_ACCESS_DENIED',
} as const

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES]

// Safe user-facing messages — never expose internal details.
const USER_MESSAGES: Record<AuthErrorCode, string> = {
  UNAUTHORIZED: 'Debes iniciar sesión para continuar.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
  INVALID_ROLE: 'Tu rol no tiene acceso a este recurso.',
  COMPANY_ACCESS_DENIED: 'No tienes acceso a esta empresa.',
  CUSTOMER_ACCESS_DENIED: 'No tienes acceso a este perfil de cliente.',
}

export class AuthError extends Error {
  public readonly code: AuthErrorCode
  public readonly userMessage: string

  constructor(code: AuthErrorCode, internalDetails?: string) {
    super(internalDetails ?? code)
    this.name = 'AuthError'
    this.code = code
    this.userMessage = USER_MESSAGES[code]
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}
