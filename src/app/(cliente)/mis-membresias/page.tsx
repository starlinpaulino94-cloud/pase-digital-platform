import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, AlertCircle, WalletCards, Gauge, CalendarClock } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { getUser } from '@/lib/auth'
import { membresiaEstadoUi } from '@/lib/estados'
import { getClienteAllMemberships } from '@/modules/cliente/queries'
import { esMarcaUnica } from '@/modules/marketplace/marcaUnica'
import { WalletStack, type WalletStackItem } from '@/components/wallet/WalletStack'
import { AnimatedCounter } from '@/components/system/AnimatedCounter'
import { EmptyState } from '@/components/system/EmptyState'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Mis membresías',
  description: 'Tus tarjetas de membresía y sus códigos QR',
}

/** Métrica compacta de la wallet (activas, usos, vencimiento). */
function StatPill({
  icon: Icon,
  label,
  value,
  tone = 'default',
  animateNumber = false,
}: {
  icon: typeof Gauge
  label: string
  value: string
  tone?: 'default' | 'success' | 'warning'
  animateNumber?: boolean
}) {
  const numero = animateNumber ? Number(value.replace(/[^\d]/g, '')) : NaN
  const contenido =
    animateNumber && Number.isFinite(numero) ? <AnimatedCounter value={numero} /> : value
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-card">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          tone === 'success'
            ? 'bg-success/12 text-success'
            : tone === 'warning'
              ? 'bg-warning/15 text-warning-foreground'
              : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold leading-tight text-foreground">{contenido}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/**
 * Mis membresías = SOLO la wallet. Una idea por pantalla: tus tarjetas, su
 * estado y su QR. Todo lo demás (campañas, beneficios, novedades, prueba
 * social) vive en el Inicio (/cliente/inicio).
 */
export default async function MisMembresias() {
  const user = await getUser()
  if (!user || !user.supabaseId) {
    redirect('/login')
  }

  // Marca única: la wallet vacía invita a los planes del negocio, no a
  // "explorar empresas" (ese lenguaje vuelve cuando haya más de una).
  const marcaUnica = await esMarcaUnica().catch(() => false)

  let memberships: Awaited<ReturnType<typeof getClienteAllMemberships>> = []
  let loadError = false
  try {
    memberships = await getClienteAllMemberships(user.supabaseId, user.metadata.clienteId)
  } catch (error) {
    loadError = true
    console.error(
      '[mis-membresias] Error loading memberships:',
      error instanceof Error ? error.message : String(error)
    )
  }

  const now = new Date()
  const activas = memberships.filter((m) => {
    const v = m.fechaVencimiento ? new Date(m.fechaVencimiento) : null
    return m.estado === 'ACTIVA' && (!v || v > now)
  })
  const usosDisponibles = activas.reduce(
    (s, m) => s + (m.plan.esIlimitado ? 0 : m.lavadosRestantes),
    0
  )
  const tieneIlimitado = activas.some((m) => m.plan.esIlimitado)
  const proximoVencimiento = activas
    .map((m) => (m.fechaVencimiento ? new Date(m.fechaVencimiento) : null))
    .filter((d): d is Date => !!d && d > now)
    .sort((a, b) => a.getTime() - b.getTime())[0]
  const diasProximo = proximoVencimiento ? differenceInDays(proximoVencimiento, now) : null

  const walletItems: WalletStackItem[] = memberships.map((m) => {
    const vencimiento = m.fechaVencimiento ? new Date(m.fechaVencimiento) : null
    const activa = m.estado === 'ACTIVA' && (!vencimiento || vencimiento > now)
    const vencida = m.estado === 'VENCIDA' || (vencimiento !== null && vencimiento <= now)
    let expiryText: string | null = null
    if (vencimiento) {
      const dias = differenceInDays(vencimiento, now)
      expiryText =
        dias > 0
          ? `Vence en ${dias} día${dias !== 1 ? 's' : ''}`
          : dias === 0
            ? 'Vence hoy'
            : `Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
    }
    return {
      id: m.id,
      card: {
        company: {
          name: m.company.name,
          logoUrl: m.company.logoUrl,
          colorPrimario: m.company.colorPrimario,
        },
        planNombre: m.plan.nombre,
        estadoLabel: membresiaEstadoUi(m.estado).labelCliente,
        tone: activa ? ('active' as const) : vencida ? ('expired' as const) : ('pending' as const),
        expiryText,
        esIlimitado: m.plan.esIlimitado,
        usosRestantes: m.lavadosRestantes,
        usosTotales: m.plan.lavadosIncluidos ?? null,
      },
      qrToken: m.qrToken?.token ?? null,
      isActive: activa,
    }
  })

  return (
    <main className="container max-w-3xl py-8">
      {/* Cabecera mínima: una idea por pantalla */}
      <header className="animate-fade-up mb-6">
        <h1 className="text-h1 text-foreground">Mis membresías</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tus tarjetas y sus QR. Toca una para girarla y mostrar tu llave de acceso.
        </p>
      </header>

      {loadError ? (
        <EmptyState
          icon={AlertCircle}
          title="No pudimos cargar tus membresías"
          description="Hubo un problema al conectar con el servidor. Intenta de nuevo en unos momentos."
          action={
            <Button asChild variant="outline">
              <Link href="/mis-membresias">Reintentar</Link>
            </Button>
          }
        />
      ) : memberships.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Tu wallet está lista"
          description={
            marcaUnica
              ? 'Activa tu primera membresía para empezar a disfrutar beneficios con tu QR.'
              : 'Explora las empresas disponibles y activa tu primera membresía para empezar a disfrutar beneficios con tu QR.'
          }
          action={
            <>
              <Button asChild size="lg">
                {marcaUnica ? (
                  <Link href="/cliente/planes">Ver membresías</Link>
                ) : (
                  <Link href="/cliente/explorar">Explorar empresas</Link>
                )}
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/cliente/promociones">Ver ofertas</Link>
              </Button>
            </>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Vistazo de la wallet */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatPill
              icon={WalletCards}
              label={`Membresía${activas.length !== 1 ? 's' : ''} activa${activas.length !== 1 ? 's' : ''}`}
              value={String(activas.length)}
              tone="success"
              animateNumber
            />
            <StatPill
              icon={Gauge}
              label="Usos disponibles"
              value={tieneIlimitado ? 'Ilimitados' : String(usosDisponibles)}
              animateNumber={!tieneIlimitado}
            />
            <StatPill
              icon={CalendarClock}
              label="Próximo vencimiento"
              value={
                diasProximo === null
                  ? '—'
                  : diasProximo === 0
                    ? 'Hoy'
                    : `${diasProximo} día${diasProximo !== 1 ? 's' : ''}`
              }
              tone={diasProximo !== null && diasProximo <= 7 ? 'warning' : 'default'}
            />
          </div>

          {/* La wallet: protagonista única de la pantalla */}
          <WalletStack items={walletItems} />
        </div>
      )}
    </main>
  )
}
