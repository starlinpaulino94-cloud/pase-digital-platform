import { prisma } from '@/lib/prisma'
import type { SessionUser } from '@/types'

/**
 * Sistema híbrido de permisos.
 *
 * Los roles base (AppRole) dan acceso a rutas (validado en proxy.ts y guards.ts).
 * Los permisos granulares (Permission) autorizan acciones específicas dentro de una ruta.
 *
 * Reglas:
 * - SUPERADMIN siempre tiene todos los permisos.
 * - Para los demás roles, se consulta la tabla Permission del usuario.
 * - Si un permiso no está registrado para el usuario, se deniega por defecto.
 *
 * Keys de permisos disponibles:
 *   scan_qr              — escanear QR de clientes
 *   confirm_visit        — confirmar uso de un servicio
 *   approve_payments     — aprobar pagos pendientes
 *   reject_payments      — rechazar pagos pendientes
 *   print_receipts       — imprimir/reimprimir comprobantes
 *   manage_plans         — crear/editar planes
 *   manage_employees     — gestionar empleados
 *   manage_branches      — gestionar sucursales
 *   manage_banks         — gestionar cuentas bancarias
 *   view_reports         — ver reportes
 *   send_notifications   — enviar notificaciones manuales
 *   manage_referrals     — gestionar referidos y recompensas
 *   manage_permissions   — asignar permisos a usuarios
 */

export const PERMISSION_KEYS = [
  'scan_qr',
  'confirm_visit',
  'approve_payments',
  'reject_payments',
  'print_receipts',
  'manage_plans',
  'manage_employees',
  'manage_branches',
  'manage_banks',
  'view_reports',
  'send_notifications',
  'manage_referrals',
  'manage_permissions',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  scan_qr: 'Escanear QR',
  confirm_visit: 'Confirmar uso de servicio',
  approve_payments: 'Aprobar pagos',
  reject_payments: 'Rechazar pagos',
  print_receipts: 'Imprimir comprobantes',
  manage_plans: 'Gestionar planes',
  manage_employees: 'Gestionar empleados',
  manage_branches: 'Gestionar sucursales',
  manage_banks: 'Gestionar cuentas bancarias',
  view_reports: 'Ver reportes',
  send_notifications: 'Enviar notificaciones',
  manage_referrals: 'Gestionar referidos',
  manage_permissions: 'Asignar permisos',
}

/**
 * Verifica si un usuario tiene un permiso específico.
 * SUPERADMIN tiene todos los permisos implícitamente.
 */
export async function hasPermission(
  user: SessionUser | null,
  key: PermissionKey
): Promise<boolean> {
  if (!user) return false
  if (user.metadata.role === 'SUPERADMIN') return true

  const dbUserId = user.metadata.dbUserId
  if (!dbUserId) return false

  const perm = await prisma.permission.findUnique({
    where: { userId_key: { userId: dbUserId, key } },
  })
  return perm?.granted ?? false
}

/**
 * Verifica múltiples permisos. Devuelve true si tiene TODOS.
 */
export async function hasAllPermissions(
  user: SessionUser | null,
  keys: PermissionKey[]
): Promise<boolean> {
  const results = await Promise.all(keys.map((k) => hasPermission(user, k)))
  return results.every(Boolean)
}

/**
 * Obtiene todos los permisos de un usuario.
 */
export async function getUserPermissions(
  dbUserId: string
): Promise<Record<string, boolean>> {
  const perms = await prisma.permission.findMany({
    where: { userId: dbUserId },
  })
  const map: Record<string, boolean> = {}
  for (const k of PERMISSION_KEYS) {
    const p = perms.find((x) => x.key === k)
    map[k] = p?.granted ?? false
  }
  return map
}
