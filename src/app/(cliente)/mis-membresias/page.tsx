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
import { getPruebaSocial, type PruebaSocial as PruebaSocialData } from '@/modules/engagement/pruebaSocial'
import { getGamificacion, type GamificacionData } from '@/modules/engagement/gamificacion'
import { getEngagementConfig } from '@/modules/engagement/config'
import { normalizeEngagementConfig, type EngagementConfig } from '@/lib/engagementConfig'
import { MomentosVivos } from '@/components/engagement/MomentosVivos'
import { CampanasVivas } from '@/components/engagement/CampanasVivas'
import { PruebaSocial } from '@/components/engagement/PruebaSocial'
import { Gamificacion } from '@/components/engagement/Gamificacion'
import { PopupInteligente } from '@/components/engagement/PopupInteligente'
import { CarrouselesHome } from '@/components/engagement/CarrouselesHome'
import { WalletStack, type WalletStackItem } from '@/components/wallet/WalletStack'
import { AnimatedCounter } from '@/components/system/AnimatedCounter'
import { EmptyState } from '@/components/system/EmptyState'
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
  animateNumber = false,
}: {
  icon: typeof Gauge
  label: string
  value: string
  tone?: 'default' | 'success' | 'warning'
  /** Anima el valor numérico contando hacia arriba al entrar en pantalla. */
  animateNumber?: boolean
}) {
  const numero = animateNumber ? Number(value.replace(/[^\d]/g, '')) : NaN
  const contenido =
    animateNumber && Number.isFinite(numero) ? (
      <AnimatedCounter value={numero} />
    ) : (
      value
    )
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
  let pruebaSocial: PruebaSocialData | null = null
  let gamificacion: GamificacionData | null = null
  // Fase 7: personalización del motor por empresa (color + módulos visibles).
  let engagement: EngagementConfig = normalizeEngagementConfig(null, null)
  if (user.metadata.clienteId && user.metadata.companyId) {
    ;[momentos, campanas, pruebaSocial, gamificacion, engagement] = await Promise.all([
      getMomentosVivos(user.metadata.clienteId, user.metadata.companyId).catch(
        () => ({ nombre: null, momentos: [] }) as MomentosData
      ),
      getCampanasVivas(user.metadata.companyId).catch(() => []),
      getPruebaSocial(user.metadata.companyId).catch(() => null),
      getGamificacion(user.metadata.clienteId, user.metadata.companyId).catch(() => null),
      getEngagementConfig(user.metadata.companyId).catch(() =>
        normalizeEngagementConfig(null, null)
      ),
    ])
  }

  // Prueba social: solo si hay masa suficiente (evita "1 miembro" poco creíble).
  const mostrarPruebaSocial =
    !!pruebaSocial &&
    (pruebaSocial.totalMiembros >= 3 || pruebaSocial.recientes.length >= 2)

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

  // Wallet Stack: tarjetas "físicas digitales" con el color de marca de cada
  // negocio, apiladas estilo Apple Wallet (tocar una la trae al frente; tocar
  // la del frente la gira para revelar su QR).
  const ESTADO_LABEL: Record<string, string> = {
    ACTIVA: 'Activa',
    PENDIENTE: 'Pendiente',
    PENDIENTE_PAGO: 'Esperando pago',
    VENCIDA: 'Vencida',
    CANCELADA: 'Cancelada',
    RECHAZADA: 'Rechazada',
  }
  const walletItems: WalletStackItem[] = memberships.map((m) => {
    const vencimiento = m.fechaVencimiento ? new Date(m.fechaVencimiento) : null
    const activa = m.estado === 'ACTIVA' && (!vencimiento || vencimiento > now)
    const vencida =
      m.estado === 'VENCIDA' || (vencimiento !== null && vencimiento <= now)
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
        estadoLabel: ESTADO_LABEL[m.estado] ?? m.estado,
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
    <main className="container max-w-5xl py-8">
      {/* Felicitación por encima de la app tras registrarse con auto-login */}
      <CelebracionBienvenida />

      {/* Engagement Engine · Fase 8: popup inteligente (aviso oportuno, máx 1/día) */}
      {!loadError && engagement.popups && (
        <PopupInteligente
          momentos={momentos.momentos}
          campanas={campanas}
          color={engagement.color}
        />
      )}
      {/* ── 1 · Header de app: saludo + avatar (patrón premium mobile) ────── */}
      <header className="animate-fade-up mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-500 text-sm font-bold text-white shadow-glow"
            >
              {(momentos.nombre ?? 'M').trim().slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                {momentos.nombre ? `¡Hola, ${momentos.nombre.split(' ')[0]}!` : '¡Hola! 👋'}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Tu wallet digital MembeGo
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/cliente/explorar">
              <Compass className="mr-1.5 h-4 w-4" />
              Explorar
            </Link>
          </Button>
        </div>
      </header>

      {/* ── 2 · Hero banner: la campaña viva manda (rotativo, con contador) ── */}
      {!loadError && engagement.campanas && <CampanasVivas campanas={campanas} />}

      {/* ── 3 · Vistazo rápido: contadores animados ─────────────────────────── */}
      {!loadError && memberships.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
      )}

      {/* Engagement Engine · Fase 6: gamificación + ruleta — Fase 7: opcional */}
      {!loadError && engagement.gamificacion && gamificacion && (
        <Gamificacion data={gamificacion} color={engagement.color} />
      )}

      {/* Engagement Engine · Momentos vivos (datos reales, con urgencia) */}
      {!loadError && <MomentosVivos nombre={momentos.nombre} momentos={momentos.momentos} />}

      {/* Engagement Engine · Fase 4: prueba social — Fase 7: opcional */}
      {!loadError && engagement.pruebaSocial && mostrarPruebaSocial && pruebaSocial && (
        <PruebaSocial data={pruebaSocial} color={engagement.color} />
      )}

      {/* Onboarding B2C: sugerencia para completar la cuenta (nunca obligatoria).
          Se muestra mientras falten pasos; cerrarla la pospone unos días. */}
      {onboarding && (
        <div className="mb-6">
          <OnboardingClienteFirstVisit onboarding={onboarding} />
        </div>
      )}

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
        <div className="space-y-8">
          <EmptyState
            icon={CreditCard}
            title="Tu wallet está lista"
            description="Explora las empresas disponibles y activa tu primera membresía para empezar a disfrutar beneficios con tu QR."
            action={
              <>
                <Button asChild size="lg">
                  <Link href="/cliente/explorar">Explorar empresas</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/cliente/promociones">Ver promociones</Link>
                </Button>
              </>
            }
          />
          {feed && engagement.carruseles && <CarrouselesHome feed={feed} />}
          <FeedNovedades novedades={novedades} />
        </div>
      ) : (
        <div className="space-y-10">
          {/* ── Wallet Stack (estilo Apple Wallet) ────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Tus tarjetas
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {memberships.length}
                </span>
              </h2>
            </div>
            <WalletStack items={walletItems} />
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
          {feed && engagement.carruseles && <CarrouselesHome feed={feed} />}

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
