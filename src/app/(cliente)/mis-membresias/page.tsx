import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  Compass,
  AlertCircle,
  Sparkles,
  WalletCards,
  Gauge,
  CalendarClock,
  Tag,
  Receipt,
  Gift,
  ArrowRight,
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { getUser } from '@/lib/auth'
import { getClienteAllMemberships } from '@/modules/cliente/queries'
import { getNovedadesInicio, getOnboardingCliente, getPromoFeed, type PromoFeed } from '@/modules/social/queries'
import { getMomentosVivos, type MomentosVivos as MomentosData } from '@/modules/engagement/momentos'
import { getCampanasVivas, type CampanaViva } from '@/modules/engagement/campanas'
import { MomentosVivos } from '@/components/engagement/MomentosVivos'
import { CampanasVivas } from '@/components/engagement/CampanasVivas'
import { CarrouselesHome } from '@/components/engagement/CarrouselesHome'
import { MembershipCard } from '@/components/cliente/MembershipCard'
import { CelebracionBienvenida } from '@/components/cliente/CelebracionBienvenida'
import { FeedNovedades } from '@/components/cliente/FeedNovedades'
import { OnboardingClienteFirstVisit } from '@/components/cliente/OnboardingClienteFirstVisit'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Mis Membresías',
  description: 'Administra todas tus membresías en un solo lugar',
}

/** Métrica compacta de la cabecera (estructura premium, solo presentación). */
function StatPill({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Gauge
  label: string
  value: string
  tone?: 'default' | 'success' | 'warning'
}) {
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
        <p className="truncate text-lg font-bold leading-tight text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/** Acceso rápido a las secciones más usadas (misma navegación, mejor jerarquía). */
function QuickAction({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string
  icon: typeof Tag
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-premium"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{desc}</span>
      </span>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}

export default async function MisMembresias() {
  const user = await getUser()
  if (!user || !user.supabaseId) {
    redirect('/login')
  }

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

  // Engagement Engine · Fase 1: momentos vivos del Home (datos reales; falla
  // en silencio porque es realce, no núcleo).
  let momentos: MomentosData = { nombre: null, momentos: [] }
  let campanas: CampanaViva[] = []
  if (user.metadata.clienteId && user.metadata.companyId) {
    ;[momentos, campanas] = await Promise.all([
      getMomentosVivos(user.metadata.clienteId, user.metadata.companyId).catch(
        () => ({ nombre: null, momentos: [] }) as MomentosData
      ),
      getCampanasVivas(user.metadata.companyId).catch(() => []),
    ])
  }

  const cookieStore = await cookies()
  const onboardingSeen = cookieStore.has('membego_onboarding_seen')

  // Feed de novedades, carruseles y onboarding (fallan en silencio: realce).
  const [novedades, feed, onboarding] = user.metadata.dbUserId
    ? await Promise.all([
        getNovedadesInicio(user.metadata.dbUserId),
        getPromoFeed(user.metadata.dbUserId).catch(
          (): PromoFeed => ({
            seguidas: [],
            destacadas: [],
            nuevas: [],
            expiranPronto: [],
            recomendadas: [],
            empresasRecomendadas: [],
          })
        ),
        onboardingSeen
          ? Promise.resolve(null)
          : getOnboardingCliente(user.metadata.dbUserId, user.supabaseId).catch(
              () => null
            ),
      ])
    : [[], null, null]

  // Resumen para la cabecera (solo presentación, derivado de lo ya cargado).
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
  const diasProximo = proximoVencimiento
    ? differenceInDays(proximoVencimiento, now)
    : null

  return (
    <main className="container max-w-5xl py-8">
      {/* Felicitación por encima de la app tras registrarse con auto-login */}
      <CelebracionBienvenida />
      {/* ── Cabecera ──────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Tu wallet digital
            </p>
            <h1 className="mt-1.5 text-h1 tracking-tight text-foreground">
              Mis membresías
            </h1>
            <p className="mt-1 text-small text-muted-foreground">
              Tus membresías digitales y sus códigos QR, en un solo lugar.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/cliente/explorar">
              <Compass className="mr-2 h-4 w-4" />
              Explorar empresas
            </Link>
          </Button>
        </div>

        {/* Resumen — solo si hay membresías (evita ruido en el vacío) */}
        {!loadError && memberships.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatPill
              icon={WalletCards}
              label={`Membresía${activas.length !== 1 ? 's' : ''} activa${activas.length !== 1 ? 's' : ''}`}
              value={String(activas.length)}
              tone="success"
            />
            <StatPill
              icon={Gauge}
              label="Usos disponibles"
              value={tieneIlimitado ? 'Ilimitados' : String(usosDisponibles)}
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
        )}
      </header>

      {/* Engagement Engine · Fase 2: campañas de marketing vivas (banner + contador) */}
      {!loadError && <CampanasVivas campanas={campanas} />}

      {/* Engagement Engine · Momentos vivos (datos reales, con urgencia) */}
      {!loadError && <MomentosVivos nombre={momentos.nombre} momentos={momentos.momentos} />}

      {/* Onboarding B2C: solo la primera visita */}
      {onboarding && (
        <div className="mb-6">
          <OnboardingClienteFirstVisit onboarding={onboarding} />
        </div>
      )}

      {loadError ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </span>
          <div>
            <p className="font-semibold text-foreground">
              No pudimos cargar tus membresías.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hubo un problema al conectar con el servidor. Intenta de nuevo en unos
              momentos.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/mis-membresias">Reintentar</Link>
          </Button>
        </div>
      ) : memberships.length === 0 ? (
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-10 text-center shadow-card">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-info/10 blur-3xl" />
            <div className="relative mx-auto flex max-w-md flex-col items-center gap-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <CreditCard className="h-8 w-8 text-primary" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Tu wallet está lista
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Explora las empresas disponibles y activa tu primera membresía
                  para empezar a disfrutar beneficios con tu QR.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/cliente/explorar">Explorar empresas</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/cliente/promociones">Ver promociones</Link>
                </Button>
              </div>
            </div>
          </div>
          {feed && <CarrouselesHome feed={feed} />}
          <FeedNovedades novedades={novedades} />
        </div>
      ) : (
        <div className="space-y-10">
          {/* ── Tarjetas ──────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Tus tarjetas
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {memberships.length}
                </span>
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {memberships.map((membership) => (
                <MembershipCard key={membership.id} membership={membership} />
              ))}
            </div>
          </section>

          {/* ── Accesos rápidos ───────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Accesos rápidos
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction
                href="/cliente/planes"
                icon={Sparkles}
                title="Planes"
                desc="Elige o cambia tu plan"
              />
              <QuickAction
                href="/cliente/promociones"
                icon={Tag}
                title="Promociones"
                desc="Ofertas para ti"
              />
              <QuickAction
                href="/cliente/mis-promociones"
                icon={Gift}
                title="Mis beneficios"
                desc="Tus promociones y QR"
              />
              <QuickAction
                href="/cliente/pagos"
                icon={Receipt}
                title="Mis pagos"
                desc="Historial y estado"
              />
            </div>
          </section>

          {/* ── Carruseles tipo Netflix (Engagement Engine · Fase 3) ──────── */}
          {feed && <CarrouselesHome feed={feed} />}

          {/* ── Novedades ─────────────────────────────────────────────────── */}
          <FeedNovedades novedades={novedades} />

          {/* ── CTA final ─────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-info/10 p-8 text-center shadow-card">
            <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  ¿Quieres más beneficios?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Descubre otras empresas y sus promociones exclusivas.
                </p>
              </div>
              <Button asChild size="lg" className="shadow-glow">
                <Link href="/cliente/explorar">Explorar más empresas</Link>
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
