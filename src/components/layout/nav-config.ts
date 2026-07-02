import {
  LayoutDashboard,
  Users,
  CreditCard,
  Megaphone,
  Gift,
  ScanLine,
  Wallet,
  Building2,
  Landmark,
  Package,
  MessageCircle,
  UserCog,
  BarChart3,
  ClipboardList,
  History,
  User,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { AppRole } from '@/types'

export interface NavLink {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  items: NavLink[]
}

const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Inicio',
    items: [{ href: '/admin/dashboard', label: 'Resumen', icon: LayoutDashboard }],
  },
  {
    label: 'Clientes',
    items: [
      { href: '/admin/clientes', label: 'Clientes', icon: Users },
      { href: '/admin/membresias', label: 'Membresías', icon: CreditCard },
      { href: '/admin/promociones', label: 'Promociones', icon: Megaphone },
      { href: '/admin/referidos', label: 'Referidos', icon: Gift },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/admin/scanner', label: 'Escáner QR', icon: ScanLine },
      { href: '/admin/pagos', label: 'Pagos', icon: Wallet },
    ],
  },
  {
    label: 'Empresa',
    items: [
      { href: '/admin/sucursales', label: 'Sucursales', icon: Building2 },
      { href: '/admin/metodos-pago', label: 'Métodos de pago', icon: Landmark },
      { href: '/admin/planes', label: 'Planes', icon: Package },
    ],
  },
  {
    label: 'Marketing',
    items: [{ href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle }],
  },
  {
    label: 'Configuración',
    items: [
      { href: '/admin/empleados', label: 'Empleados', icon: UserCog },
      { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
    ],
  },
]

const CLIENTE_NAV: NavGroup[] = [
  {
    label: 'Inicio',
    items: [{ href: '/cliente/dashboard', label: 'Mi panel', icon: LayoutDashboard }],
  },
  {
    label: 'Membresía',
    items: [
      { href: '/cliente/membresia', label: 'Mi membresía', icon: CreditCard },
      { href: '/cliente/planes', label: 'Oportunidades', icon: Package },
      { href: '/cliente/pagos', label: 'Mis pagos', icon: Wallet },
    ],
  },
  {
    label: 'Beneficios',
    items: [
      { href: '/cliente/promociones', label: 'Promociones', icon: Megaphone },
      { href: '/cliente/referidos', label: 'Referidos', icon: Gift },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { href: '/cliente/historial', label: 'Historial', icon: History },
      { href: '/cliente/perfil', label: 'Perfil', icon: User },
    ],
  },
]

const SUPERADMIN_NAV: NavGroup[] = [
  {
    label: 'Inicio',
    items: [{ href: '/superadmin/dashboard', label: 'Resumen', icon: LayoutDashboard }],
  },
  {
    label: 'Plataforma',
    items: [
      { href: '/superadmin/empresas', label: 'Empresas', icon: Building2 },
      { href: '/superadmin/planes', label: 'Planes globales', icon: Package },
      { href: '/superadmin/membresias', label: 'Membresías globales', icon: CreditCard },
      { href: '/superadmin/operaciones', label: 'Operaciones', icon: ClipboardList },
      { href: '/superadmin/reportes', label: 'Reportes globales', icon: BarChart3 },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { href: '/admin/clientes', label: 'Clientes', icon: Users },
      { href: '/admin/membresias', label: 'Membresías', icon: CreditCard },
      { href: '/admin/promociones', label: 'Promociones', icon: Megaphone },
      { href: '/admin/referidos', label: 'Referidos', icon: Gift },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/admin/scanner', label: 'Escáner QR', icon: ScanLine },
      { href: '/admin/pagos', label: 'Pagos', icon: Wallet },
    ],
  },
  {
    label: 'Empresa',
    items: [
      { href: '/admin/sucursales', label: 'Sucursales', icon: Building2 },
      { href: '/admin/metodos-pago', label: 'Métodos de pago', icon: Landmark },
      { href: '/admin/planes', label: 'Planes', icon: Package },
    ],
  },
  {
    label: 'Marketing',
    items: [{ href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle }],
  },
  {
    label: 'Configuración',
    items: [
      { href: '/admin/empleados', label: 'Empleados', icon: UserCog },
      { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
    ],
  },
]

const EMPLEADO_NAV: NavGroup[] = [
  {
    label: 'Operaciones',
    items: [{ href: '/empleado/scanner', label: 'Escanear QR', icon: ScanLine }],
  },
]

/** Resolve the sidebar navigation for any role (8 roles collapse to 4 areas). */
export function navForRole(role: AppRole): NavGroup[] {
  switch (role) {
    case 'CLIENTE':
      return CLIENTE_NAV
    case 'SUPERADMIN':
      return SUPERADMIN_NAV
    case 'EMPLEADO':
    case 'RECEPCION':
      return EMPLEADO_NAV
    default:
      // ADMINISTRADOR, GERENTE, CAJERO, ADMIN_EMPRESA
      return ADMIN_NAV
  }
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case 'CLIENTE':
      return 'Cliente'
    case 'SUPERADMIN':
      return 'Superadmin'
    case 'EMPLEADO':
      return 'Empleado'
    case 'RECEPCION':
      return 'Recepción'
    case 'GERENTE':
      return 'Gerente'
    case 'CAJERO':
      return 'Cajero'
    default:
      return 'Administrador'
  }
}

/** Icon per role, accessed by property (avoids "component created during render"). */
export const ROLE_ICONS: Record<AppRole, LucideIcon> = {
  SUPERADMIN: ShieldCheck,
  ADMINISTRADOR: ShieldCheck,
  GERENTE: ShieldCheck,
  CAJERO: ShieldCheck,
  ADMIN_EMPRESA: ShieldCheck,
  RECEPCION: ScanLine,
  EMPLEADO: ScanLine,
  CLIENTE: User,
}

/** Flattened links for breadcrumb/title resolution. */
export function allLinks(groups: NavGroup[]): NavLink[] {
  return groups.flatMap((g) => g.items)
}
