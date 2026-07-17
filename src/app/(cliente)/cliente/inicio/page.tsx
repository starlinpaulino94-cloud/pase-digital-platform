import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Compass, AlertCircle, WalletCards } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { getUser } from '@/lib/auth'
import { getClienteAllMemberships, getBeneficioDisponible } from '@/modules/cliente/queries'
import { getNovedadesInicio, getOnboardingCliente } from '@/modules/social/queries'
import { getMomentosVivos, type MomentosVivos as MomentosData } from '@/modules/engagement/momentos'
import { getCampanasVivas, type CampanaViva } from '@/modules/engagement/campanas'
import { getPruebaSocial, type PruebaSocial as PruebaSocialData } from '@/modules/engagement/pruebaSocial'
import { getGamificacion, type GamificacionData } from '@/modules/engagement/gamificacion'
import { getEngagementConfig } from '@/modules/engagement/config'
import { normalizeEngagementConfig, type EngagementConfig } from '@/lib/engagementConfig'
import { PruebaSocial } from '@/components/engagement/PruebaSocial'
import { PopupInteligente } from '@/components/engagement/PopupInteligente'
import { EmptyState } from '@/components/system/EmptyState'
import { CelebracionBienvenida } from '@/components/cliente/CelebracionBienvenida'
import { DescubreMas } from '@/components/cliente/DescubreMas'
import { OnboardingClienteFirstVisit } from '@/components/cliente/OnboardingClienteFirstVisit'
import { Button } from '@/components/ui/button'
import { elegirExperiencias } from '@/modules/experience/engine'
import { ExperienciaHero } from '@/components/engagement/ExperienciaHero'
import { WalletStack, type WalletStackItem } from '@/components/wallet/WalletStack'
import { membresiaEstadoUi } from '@/lib/estados'

export const metadata = {
  title: 'Inicio',
  description: 'Tu resumen: beneficios, campañas y novedades de tus empresas',
}

export default async function InicioCliente() {
  const user = await getUser()
  if (!user || !user.supabaseId) {
    redirect('/login')
  }

  // Rendimiento (auditoría Enterprise): TODO el Home se carga en UNA sola ola
  // paralela. Ninguna consulta depende de otra: solo del usuario ya resuelto.
  const cookieStore = await cookies()
  const onboardingSeen = cookieStore.has('membego_onboarding_seen')
  const { clienteId, companyId, dbUserId } = user.metadata

  const [
    beneficio,
    membershipsRes,
    momentos,
    campanas,
    pruebaSocial,
    gamificacion,
    engagement,
    novedades,
    onboarding,
  ] = await Promise.all([
    getBeneficioDisponible(clienteId),
    getClienteAllMemberships(user.supabaseId, clienteId).catch((error) => {
      console.error(
        '[mis-membresias] Error loading memberships:',
        error instanceof Error ? error.message : String(error)
      )
      return null
    }),
    clienteId && companyId
      ? getMomentosVivos(clienteId, companyId).catch(
          () => ({ nombre: null, momentos: [] }) as MomentosData
        )
      : Promise.resolve({ nombre: null, momentos: [] } as MomentosData),
    companyId ? getCampanasVivas(companyId).catch(() => []) : Promise.resolve([] as CampanaViva[]),
    companyId
      ? getPruebaSocial(companyId).catch(() => null)
      : Promise.resolve(null as PruebaSocialData | null),
    clienteId && companyId
      ? getGamificacion(clienteId, companyId).catch(() => null)
      : Promise.resolve(null as GamificacionData | null),
    companyId
      ? getEngagementConfig(companyId).catch(() => normalizeEngagementConfig(null, null))
      : Promise.resolve<EngagementConfig>(normalizeEngagementConfig(null, null)),
    dbUserId ? getNovedadesInicio(dbUserId) : Promise.resolve([]),
    dbUserId && !onboardingSeen
      ? getOnboardingCliente(dbUserId, user.supabaseId).catch(() => null)
      : Promise.resolve(null),
  ])

  const loadError = membershipsRes === null
  const memberships = membershipsRes ?? []
  const now = new Date()

  // Prueba social: solo si hay masa suficiente (evita "1 miembro" poco creíble).
  const mostrarPruebaSocial =
    !!pruebaSocial &&
    (pruebaSocial.totalMiembros >= 3 || pruebaSocial.recientes.length >= 2)

  // MEE · El motor de experiencias elige el protagonista (beneficios propios,
  // pago pendiente, campaña destacada de la empresa o invitación) — UNA sola
  // escalera de prioridad para el héroe Y el popup, así nunca se duplican.
  const membresiaPendiente = memberships.find((m) =>
    ['PENDIENTE', 'RECHAZADA'].includes(m.estado)
  )
  const experiencias = loadError
    ? []
    : elegirExperiencias({
        momentos: momentos.momentos,
        beneficio,
        pagoPendiente: membresiaPendiente
          ? { membresiaId: membresiaPendiente.id, planNombre: membresiaPendiente.plan.nombre }
          : null,
        campanas: engagement.campanas ? campanas : [],
      })
  const heroExp = experiencias[0] ?? null
  const popupExp = experiencias[1] ?? null

  // Mapeo de membresías para la pila WalletStack (mismo patrón que
  // /mis-membresias, para que ambas pantallas se vean y comporten igual).
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
    <main className="container max-w-5xl py-8 xl:max-w-6xl">
      {/* Felicitación por encima de la app tras registrarse */}
      <CelebracionBienvenida />

      {/* Popup inteligente: el aviso #2 del motor (el #1 ya es el héroe) */}
      {!loadError && engagement.popups && (
        <PopupInteligente candidato={popupExp} color={engagement.color} />
      )}

      {/* ── 1 · Header de app: saludo + avatar + puntos ────── */}
      <header className="animate-fade-up mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-teal-400 text-sm font-bold text-primary-foreground shadow-glow"
            >
              {(momentos.nombre ?? 'M').trim().slice(0, 2).toUpperCase()}
            </span>
            <h1 className="text-h1 min-w-0 truncate text-foreground">
              {momentos.nombre ? `¡Hola, ${momentos.nombre.split(' ')[0]}!` : '¡Hola! 👋'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {gamificacion && (
              <Link
                href="/cliente/ruleta"
                className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-sm hover:border-primary/30 active:scale-[0.97] transition"
              >
                <span className="text-amber-500">🏆</span>
                <span>{gamificacion.puntos.toLocaleString('es-DO')} pts</span>
              </Link>
            )}
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/cliente/explorar">
                <Compass className="mr-1.5 h-4 w-4" />
                Explorar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── 2 · ACCIÓN PRINCIPAL: el Experience Engine decide (MEE) ─────────── */}
      {heroExp && <ExperienciaHero exp={heroExp} />}

      {/* ── 3 · Prueba social (compacta, solo si hay masa suficiente) ───────── */}
      {!loadError && engagement.pruebaSocial && mostrarPruebaSocial && pruebaSocial && (
        <PruebaSocial data={pruebaSocial} color={engagement.color} />
      )}

      {/* ── 4 · La wallet: el valor real de la app, a todo el ancho ─────────── */}
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
          icon={WalletCards}
          title="Tu wallet está lista"
          description="Explora las empresas disponibles y activa tu primera membresía para empezar a disfrutar beneficios con tu QR."
          action={
            <>
              <Button asChild size="lg">
                <Link href="/cliente/explorar">Explorar empresas</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/cliente/promociones">Ver ofertas</Link>
              </Button>
            </>
          }
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-h2 text-foreground mb-3 flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-primary" />
            Mis Tarjetas
          </h2>
          <WalletStack items={walletItems} />
        </div>
      )}

      {/* Onboarding B2C: después de la wallet — una tarjeta real le gana la
          primera mirada a un recordatorio de configuración. */}
      {onboarding && (
        <div className="mt-8">
          <OnboardingClienteFirstVisit onboarding={onboarding} />
        </div>
      )}

      {/* ── Descubre más: invita y gana + novedades, al final ── */}
      {!loadError && (
        <div className="mt-10">
          <DescubreMas
            novedades={novedades}
            mostrarInvitaYGana={heroExp?.tipo !== 'REFERIDOS'}
          />
        </div>
      )}
    </main>
  )
}
