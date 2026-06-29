export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId } from '@/modules/clientes/queries'
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge'
import { Badge } from '@/components/ui/badge'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId
    ? await getCustomerByUserId(session.dbUserId)
    : null

  if (!customer) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">Perfil de cliente no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Identity card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shrink-0">
              {customer.firstName[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">
                {customer.firstName} {customer.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{customer.user.email}</p>
            </div>
          </div>
          <CustomerStatusBadge status={customer.status} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Teléfono</p>
            <p className="mt-0.5 font-medium text-foreground">{customer.phone ?? ''}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
            <p className="mt-0.5 font-medium text-foreground">
              {customer.birthDate
                ? new Date(customer.birthDate).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Miembro desde</p>
            <p className="mt-0.5 font-medium text-foreground">
              {new Date(customer.createdAt).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* QR Pass CTA */}
      <Link
        href="/profile/pase"
        className="flex items-center justify-between bg-[oklch(0.155_0.028_264)] text-white rounded-2xl p-5 hover:opacity-95 transition-opacity"
      >
        <div>
          <p className="text-xs text-[oklch(0.55_0.012_264)] font-medium uppercase tracking-widest">Pase Digital</p>
          <p className="mt-1 font-semibold text-base">Ver mi código QR</p>
          <p className="mt-0.5 text-sm text-[oklch(0.65_0.012_264)]">
            Muéstralo para validar tus beneficios
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[oklch(0.22_0.030_264)] flex items-center justify-center shrink-0 text-2xl">
          🎟️
        </div>
      </Link>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Promociones', sub: 'Ver mis beneficios activos', href: '/profile/promociones' },
          { label: 'Vehículos', sub: 'Mis autos registrados', href: '/profile/vehiculos' },
          { label: 'Historial', sub: 'Mis usos anteriores', href: '/profile/historial' },
          { label: 'Empresas', sub: 'Empresas asociadas', href: '/profile/empresas' },
          { label: 'Configuración', sub: 'Editar perfil y datos', href: '/profile/configuracion' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group bg-card border border-border rounded-xl p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {item.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.sub}</p>
          </Link>
        ))}
      </div>

      {/* Companies */}
      {(customer.customerCompanies ?? []).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Empresas asociadas</p>
          <div className="flex flex-wrap gap-2">
            {customer.customerCompanies!.map((cc) => (
              <Badge key={cc.id} variant="outline">
                {cc.company?.name}
                {cc.totalVisits > 0 && (
                  <span className="ml-1 text-xs opacity-60">· {cc.totalVisits} visitas</span>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
