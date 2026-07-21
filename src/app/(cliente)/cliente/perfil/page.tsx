import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { getClientePerfil } from '@/modules/cliente/queries'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/cliente/ProfileForm'
import { IdMembegoCard } from '@/components/cliente/IdMembegoCard'
import { ensureCodigoCorto } from '@/lib/referidos'
import { VehiculoForm } from '@/components/cliente/VehiculoForm'
import { DeleteVehiculoButton } from '@/components/cliente/DeleteVehiculoButton'
import { WhatsAppButton } from '@/components/cliente/WhatsAppButton'
import { ChangePasswordForm } from '@/components/cliente/ChangePasswordForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Car,
  User,
  ShieldCheck,
  Receipt,
  History,
  Building2,
  LifeBuoy,
  WalletCards,
  Gift,
  ChevronRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mi perfil' }

/**
 * CX2 · Perfil = centro de identidad del usuario.
 *
 * Estructura unificada: hero de identidad (avatar + nombre + resumen en
 * números) → accesos rápidos → configuración por categorías (Cuenta,
 * Seguridad, Vehículos). Los formularios existentes se reutilizan tal cual:
 * cero cambios de lógica de negocio.
 */
export default async function PerfilPage() {
  const user = await requireRole('CLIENTE')

  if (!user.metadata.clienteId) {
    console.error('[cliente-perfil] Missing clienteId in metadata')
    return <p className="text-muted-foreground">Cuenta no está completamente configurada. Por favor, contacta al soporte.</p>
  }

  let cliente = null
  let loadError = false
  try {
    cliente = await getClientePerfil(user.metadata.clienteId)
  } catch (e) {
    // El log clasifica la causa (schema drift / conexión / otro) con remedio;
    // getClientePerfil ya degradó lo degradable, así que llegar aquí es real.
    const { logErrorBd } = await import('@/lib/prisma-errors')
    logErrorBd('cliente-perfil', e, { clienteId: user.metadata.clienteId })
    loadError = true
  }

  if (loadError) return <p className="text-muted-foreground">No pudimos cargar tu información. Intenta de nuevo más tarde.</p>
  if (!cliente) return <p className="text-muted-foreground">No se encontró tu información.</p>

  const isCarwash = cliente.company.type === 'carwash'

  // Resumen del hero (realce, nunca bloquea la página).
  const [whatsapp, membresiasActivas, empresasSeguidas, beneficiosActivos] = await Promise.all([
    prisma.whatsAppConfig.findUnique({ where: { companyId: cliente.companyId } }).catch(() => null),
    prisma.membership
      .count({
        where: {
          cliente: { id: cliente.id },
          estado: 'ACTIVA',
          OR: [{ fechaVencimiento: null }, { fechaVencimiento: { gt: new Date() } }],
        },
      })
      .catch(() => 0),
    user.metadata.dbUserId
      ? prisma.companyFollow.count({ where: { userId: user.metadata.dbUserId } }).catch(() => 0)
      : Promise.resolve(0),
    prisma.productoCompra
      .count({ where: { clienteId: cliente.id, estado: 'ACTIVA', usosRestantes: { gt: 0 } } })
      .catch(() => 0),
  ])

  // Regalos P2P · R1: el @ID con el que otros pueden enviarle regalos. Se
  // genera la primera vez; si la BD aún no está migrada, la tarjeta se oculta
  // sin romper el perfil.
  const idMembego = await ensureCodigoCorto(cliente.id).catch(() => null)

  const iniciales = cliente.nombre.trim().slice(0, 2).toUpperCase()

  const resumen = [
    { icon: WalletCards, valor: membresiasActivas, label: 'Membresías', href: '/mis-membresias' },
    { icon: Building2, valor: empresasSeguidas, label: 'Empresas', href: '/cliente/empresas' },
    { icon: Gift, valor: beneficiosActivos, label: 'Beneficios', href: '/cliente/mis-promociones' },
  ]

  const accesos = [
    { icon: Receipt, label: 'Mis pagos', desc: 'Estado e historial', href: '/cliente/pagos' },
    { icon: History, label: 'Historial', desc: 'Tus visitas y canjes', href: '/cliente/historial' },
    { icon: Building2, label: 'Mis empresas', desc: 'Las que sigues', href: '/cliente/empresas' },
    { icon: LifeBuoy, label: 'Ayuda', desc: 'Soporte y tickets', href: '/cliente/ayuda' },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Hero de identidad ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card">
        <div aria-hidden className="absolute inset-x-0 top-0 h-20 bg-gradient-brand opacity-90" />
        <div className="relative px-5 pb-5 pt-9">
          <div className="flex items-end justify-between gap-3">
            {cliente.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cliente.avatarUrl}
                alt=""
                className="h-20 w-20 rounded-2xl border-4 border-card object-cover shadow-premium"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-primary to-teal-400 text-xl font-bold text-primary-foreground shadow-premium">
                {iniciales}
              </span>
            )}
            {whatsapp?.activo && (
              <WhatsAppButton
                codigoPais={whatsapp.codigoPais}
                numero={whatsapp.numero}
                mensaje={whatsapp.mensajePlantilla}
              />
            )}
          </div>
          <h1 className="mt-3 text-h1 text-foreground">{cliente.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {cliente.email} · {cliente.company.name}
          </p>

          {/* Resumen en números (cada uno navega a su módulo) */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {resumen.map((r) => (
              <Link
                key={r.label}
                href={r.href}
                className="card-lift rounded-2xl border border-border/70 bg-background/60 p-3 text-center active:scale-[0.98]"
              >
                <r.icon className="mx-auto h-4 w-4 text-primary" aria-hidden />
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{r.valor}</p>
                <p className="text-[11px] text-muted-foreground">{r.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Accesos rápidos ───────────────────────────────────────────────── */}
      <section className="grid gap-2 sm:grid-cols-2">
        {accesos.map((a, i) => (
          <Link
            key={a.href}
            href={a.href}
            className={`card-lift animate-fade-up flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card active:scale-[0.98] ${['', 'delay-75', 'delay-150', 'delay-200'][i] ?? ''}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <a.icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{a.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{a.desc}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
          </Link>
        ))}
      </section>

      {/* ── Mi ID MembeGo (Regalos P2P · R1) ──────────────────────────────── */}
      {idMembego && <IdMembegoCard codigo={idMembego} />}

      {/* ── Configuración por categorías ──────────────────────────────────── */}
      <p className="text-overline">Configuración</p>

      {/* Cuenta */}
      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            clienteId={cliente.id}
            nombre={cliente.nombre}
            email={cliente.email}
            telefono={cliente.telefono ?? null}
            avatarUrl={cliente.avatarUrl ?? null}
            fechaNacimiento={
              cliente.fechaNacimiento
                ? cliente.fechaNacimiento.toISOString().slice(0, 10)
                : null
            }
            ciudad={cliente.ciudad ?? null}
            genero={cliente.genero ?? null}
            notifPromos={cliente.notifPromos}
            notifRecordatorios={cliente.notifRecordatorios}
          />
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Vehículos (solo carwash) */}
      {isCarwash && (
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4 text-muted-foreground" />
              Mis vehículos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {cliente.vehiculos.length > 0 && (
              <ul className="divide-y divide-border/60">
                {cliente.vehiculos.map((v) => {
                  const label = `${v.marca} ${v.modelo} (${v.anio})${v.placa ? ` · ${v.placa}` : ''}`
                  return (
                    <li key={v.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{v.marca} {v.modelo} ({v.anio})</p>
                          <p className="text-xs text-muted-foreground">
                            {v.color}{v.placa ? ` · ${v.placa}` : ''}
                          </p>
                        </div>
                      </div>
                      <DeleteVehiculoButton vehiculoId={v.id} label={label} />
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="rounded-xl border border-dashed border-border p-5">
              <p className="mb-4 text-sm font-medium text-foreground">Agregar vehículo</p>
              <VehiculoForm />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
