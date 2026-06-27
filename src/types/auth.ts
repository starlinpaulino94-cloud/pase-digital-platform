// Roles match the UserRole enum in prisma/schema.prisma exactly.
// Do not rename without a corresponding DB migration.
export type AppRole = 'SUPERADMIN' | 'ADMIN_EMPRESA' | 'EMPLEADO' | 'CLIENTE'

// Shape of our custom claims stored in Supabase app_metadata.
// Set by the backend (service role) — never by the client.
export interface AppMetadata {
  role: AppRole
  dbUserId?: string     // Prisma User.id
  companyId?: string    // for ADMIN_EMPRESA and EMPLEADO
  branchId?: string     // for EMPLEADO
  customerId?: string   // for CLIENTE
}

// The resolved authenticated user returned by getCurrentUser().
export interface AuthUser {
  supabaseId: string    // Supabase auth.users.id (UUID)
  email: string
  role: AppRole
  dbUserId?: string
  companyId?: string
  branchId?: string
  customerId?: string
}

// Unified return type for all Server Actions.
export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}
