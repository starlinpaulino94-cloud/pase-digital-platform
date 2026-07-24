import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { prisma } from '@/lib/prisma'
import { getCapacidadesEmpresa } from '@/modules/capacidades/resolver'
import {
  ArrowLeft,
  ScanLine,
  CalendarDays,
  QrCode,
  Building2,
  Banknote,
  Car,
  PackageSearch,
  ListOrdered,
  Camera,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Car Wash' }

interface Modulo {
  href: string | null // null = próximamente
  label: string
  descripcion: string
  icon: LucideIcon
}

/**
 * Plataforma modular · E2 — SHELL de la app Car Wash.
 *
 * El "sistema del negocio": identidad propia y SU menú de módulos operativos.
 * En E2 los módulos ENLAZAN a las pantallas actuales (regla D5: ninguna URL
 * se mueve); en E3 ganarán rutas propias con redirecciones y el dashboard
 * operativo real. Los módulos futuros (cola, inventario, evidencia) aparecen
 * como "próximamente" hasta que su capacidad se encienda (E4/E5).
 */
export default async function CarwashShellPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = user.metadata.companyId as string | undefined
  if (!companyId) {
    return <p className="text-muted-foreground">Tu cuenta no está vinculada a una empresa.</p>
  }

  const [empresa, capacidades] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, colorPrimario: true, logoUrl: true },
    }),
    getCapacidadesEmpresa(companyId).catch(() => null),
  ])
  const color = empresa?.colorPrimario || '#0D9488'
  const activas = new Set(capacidades?.activas ?? [])

  const modulos: Modulo[] = [
    { href: '/admin/scanner', label: 'Escanear QR', descripcion: 'Canjes y visitas en pista', icon: ScanLine },
    ...(activas.has('CITAS')
      ? [{ href: '/admin/citas', label: 'Citas', descripcion: 'Agenda y turnos del día', icon: CalendarDays } as Modulo]
      : []),
    ...(activas.has('SEGUIMIENTO')
      ? [{ href: '/admin/seguimiento', label: 'Seguimiento', descripcion: 'Lavados gratis: quién no ha venido', icon: QrCode } as Modulo]
      : []),
    { href: '/admin/sucursales', label: 'Sucursales', descripcion: 'Puntos de servicio', icon: Building2 },
    ...(activas.has('POS_CAJA')
      ? [{ href: '/empleado/caja', label: 'Caja', descripcion: 'Cobros y órdenes del día', icon: Banknote } as Modulo]
      : []),
    // Futuros (E5): visibles como "próximamente" hasta encender su capacidad.
    {
      href: activas.has('COLA_VEHICULOS') ? '/admin/app/carwash' : null,
      label: 'Cola de vehículos',
      descripcion: 'Estado de cada vehículo en pista',
      icon: ListOrdered,
    },
    {
      href: activas.has('INVENTARIO') ? '/admin/app/carwash' : null,
      label: 'Inventario',
      descripcion: 'Productos, químicos y existencias',
      icon: PackageSearch,
    },
    {
      href: activas.has('EVIDENCIA_FOTOS') ? '/admin/app/carwash' : null,
      label: 'Fotos antes/después',
      descripcion: 'Evidencia y control de daños',
      icon: Camera,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Cabecera con identidad de la app (no de MembeGo) */}
      <div
        className="rounded-3xl p-6 text-white shadow-premium"
        style={{ background: `linear-gradient(135deg, ${color} 0%, #0f172a 130%)` }}
      >
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a MembeGo
        </Link>
        <div className="mt-4 flex items-center gap-4">
          {empresa?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={empresa.logoUrl}
              alt=""
              className="h-14 w-14 rounded-2xl bg-white/10 object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Car className="h-7 w-7" />
            </span>
          )}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
              Sistema del negocio
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Car Wash · {empresa?.name ?? ''}
            </h1>
          </div>
        </div>
      </div>

      {/* Menú de la app */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map((m) => {
          const Icon = m.icon
          const contenido = (
            <>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: m.href ? color : '#94A3B8' }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-foreground">
                  {m.label}
                  {!m.href && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                      próximamente
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-muted-foreground">{m.descripcion}</p>
              </div>
            </>
          )
          return m.href ? (
            <Link
              key={m.label}
              href={m.href}
              className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-foreground/30"
            >
              {contenido}
            </Link>
          ) : (
            <div
              key={m.label}
              className="flex items-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5 opacity-75"
            >
              {contenido}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Los módulos marcados como &quot;próximamente&quot; se activarán desde el panel de
        capacidades cuando estén construidos.
      </p>
    </div>
  )
}
