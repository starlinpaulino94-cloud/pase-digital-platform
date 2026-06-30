export type AppRole =
  | 'SUPERADMIN'
  | 'ADMINISTRADOR'
  | 'GERENTE'
  | 'CAJERO'
  | 'RECEPCION'
  | 'EMPLEADO'
  | 'CLIENTE'
  // Legacy (se mantiene para no romper usuarios existentes)
  | 'ADMIN_EMPRESA'

export type MembershipEstado = 'PENDIENTE' | 'ACTIVA' | 'VENCIDA' | 'CANCELADA'

export type PaymentEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO'
export type PaymentMetodo = 'TRANSFERENCIA' | 'PRESENCIAL'
export type QrTokenEstado = 'ACTIVO' | 'CONSUMIDO' | 'REVOCADO'
export type ReceiptTipo = 'PAGO' | 'CONSUMO'

export interface AppMetadata {
  role: AppRole
  dbUserId: string
  clienteId?: string | null
  companyId?: string | null
  sucursalId?: string | null
}

export interface SessionUser {
  supabaseId: string
  email: string
  metadata: AppMetadata
}

// Redirección por defecto al iniciar sesión, según rol.
// Los roles administrativos van al panel /admin;
// RECEPCION y EMPLEADO van al escáner;
// CLIENTE va a su panel.
export const ROLE_HOME: Record<AppRole, string> = {
  SUPERADMIN: '/superadmin/dashboard',
  ADMINISTRADOR: '/admin/dashboard',
  GERENTE: '/admin/dashboard',
  CAJERO: '/admin/dashboard',
  RECEPCION: '/empleado/scanner',
  EMPLEADO: '/empleado/scanner',
  CLIENTE: '/cliente/dashboard',
  // Legacy
  ADMIN_EMPRESA: '/admin/dashboard',
}

// Roles que pueden acceder al panel administrativo /admin/*
export const ADMIN_ROLES: AppRole[] = [
  'SUPERADMIN',
  'ADMINISTRADOR',
  'GERENTE',
  'CAJERO',
  'ADMIN_EMPRESA', // legacy
]

// Roles que pueden acceder al escáner /empleado/*
export const SCANNER_ROLES: AppRole[] = [
  'SUPERADMIN',
  'ADMINISTRADOR',
  'GERENTE',
  'CAJERO',
  'RECEPCION',
  'EMPLEADO',
  'ADMIN_EMPRESA', // legacy
]
