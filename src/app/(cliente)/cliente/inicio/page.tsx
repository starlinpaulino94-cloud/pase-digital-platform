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
import { getClienteAllMemberships, getBeneficioDisponible } from '@/modules/cliente/queries'
import {
  getMisEmpresas,
  getNovedadesInicio,
  getOnboardingCliente,
  getPromoFeed,
  type EmpresaSeguida,
  type PromoFeed,
} from '@/modules/social/queries'
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
import { AnimatedCounter } from '@/components/system/AnimatedCounter'
import { EmptyState } from '@/components/system/EmptyState'
import { CelebracionBienvenida } from '@/components/cliente/CelebracionBienvenida'
import { FeedNovedades } from '@/components/cliente/FeedNovedades'
import { OnboardingClienteFirstVisit } from '@/components/cliente/OnboardingClienteFirstVisit'
import { Button } from '@/components/ui/button'
import { PromoBanner } from '@/components/ui/promo-banner'
import { elegirExperienciaHero } from '@/modules/experience/engine'
import { ExperienciaHero } from '@/components/engagement/ExperienciaHero'

export const metadata = {
  title: 'Inicio',
  description: 'Tu resumen: beneficios, campañas y novedades de tus empresas',
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
      className="group card-lift flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-card hover:border-primary/30 active:scale-[0.98]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
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

export default async function InicioCliente() {
  const user = await getUser()
  if (!user || !user.supabaseId) {
    redirect('/login')
  }

  // MOB: el beneficio activo más reciente protagoniza el Home (falla en null).
  const beneficio = await getBeneficioDisponible(user.metadata.clienteId)

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

  // Feed de novedades, carruseles, empresas seguidas y onboarding
  // (fallan en silencio: realce).
  const [novedades, feed, onboarding, empresasSeguidas] = user.metadata.dbUserId
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
        getMisEmpresas(user.metadata.dbUserId).catch((): EmpresaSeguida[] => []),
      ])
    : [[], null, null, [] as EmpresaSeguida[]]

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

  // MEE · El motor de experiencias elige el protagonista de la pantalla a
  // partir de datos YA cargados (lógica pura, cero consultas extra).
  const membresiaPendiente = memberships.find((m) =>
    ['PENDIENTE', 'RECHAZADA'].includes(m.estado)
  )
  const experienciaHero = loadError
    ? null
    : elegirExperienciaHero({
        momentos: momentos.momentos,
        beneficio,
        pagoPendiente: membresiaPendiente
          ? { membresiaId: membresiaPendiente.id, planNombre: membresiaPendiente.plan.nombre }
          : null,
      })


  return (
    <main className="container max-w-5xl py-8 xl:max-w-6xl">
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-teal-400 text-sm font-bold text-primary-foreground shadow-glow"
            >
              {(momentos.nombre ?? 'M').trim().slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="text-h1 truncate text-foreground">
                {momentos.nombre ? `¡Hola, ${momentos.nombre.split(' ')[0]}!` : '¡Hola! 👋'}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Tus beneficios, siempre contigo
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

      {/* ── 2 · ACCIÓN PRINCIPAL: el Experience Engine decide (MEE) ───────────
           Escalera de prioridad: por vencer (FlashPromotion con countdown) >
           beneficio listo > pago pendiente > referidos nuevos. Nunca aleatorio;
           nunca pantalla estática si hay algo accionable. */}
      {experienciaHero && <ExperienciaHero exp={experienciaHero} />}

      {/* ── 3 · Hero banner: la campaña viva manda (rotativo, con contador) ── */}
      {!loadError && engagement.campanas && <CampanasVivas campanas={campanas} />}

      {/* ── 4 · Vistazo rápido: contadores animados ─────────────────────────── */}
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
          {/* ── Wallet + Invita y gana: lado a lado en desktop (DXS: más
               contexto en el mismo alto de pantalla; apilados en móvil) ── */}
          <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          {/* ── Acceso a la wallet (la pila completa vive en Mis membresías) ── */}
          <Link
            href="/mis-membresias"
            className="group card-lift animate-fade-up flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-card hover:border-primary/30"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-400 text-primary-foreground shadow-glow">
              <WalletCards className="h-6 w-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-h3 text-foreground">Mis membresías</span>
              <span className="block truncate text-sm text-muted-foreground">
                {activas.length} activa{activas.length !== 1 ? 's' : ''} · toca para ver tus tarjetas y QR
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>

          {/* ── Invita y gana: siempre visible en el Home (crecimiento) ────── */}
          <div className="animate-fade-up delay-100">
            <PromoBanner
              tono="celebracion"
              eyebrow="Invita y gana"
              titulo="Regala beneficios, gana premios"
              descripcion="Comparte tu enlace: tus amigos reciben un regalo y tú acumulas recompensas."
              media={<span className="text-4xl" aria-hidden>🎉</span>}
              className="h-full"
            >
              <Button asChild variant="glass" className="font-semibold text-white">
                <Link href="/cliente/invita-y-gana">
                  Invitar ahora
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </PromoBanner>
          </div>
          </div>

          {/* ── Empresas que sigo: carrusel horizontal (zona del pulgar) ───── */}
          {empresasSeguidas.length > 0 && (
            <section className="animate-fade-up delay-75 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-h2 text-foreground">Empresas que sigo</h2>
                <Link
                  href="/cliente/empresas"
                  className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Ver todas
                </Link>
              </div>
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {empresasSeguidas.slice(0, 12).map((e) => (
                  <Link
                    key={e.followId}
                    href={`/cliente/empresas/${e.company.slug}`}
                    className="card-lift flex w-24 shrink-0 flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-3 text-center shadow-card active:scale-[0.97]"
                  >
                    {e.company.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.company.logoUrl}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {e.company.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
                      {e.company.name}
                    </span>
                    {e.company.activePromotionsCount > 0 && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        {e.company.activePromotionsCount} promo{e.company.activePromotionsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Accesos rápidos ───────────────────────────────────────────── */}
          <section className="animate-fade-up delay-150 space-y-4">
            <h2 className="text-h2 text-foreground">
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
