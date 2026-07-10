import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Compass, AlertCircle, Sparkles } from 'lucide-react'
import { getUser } from '@/lib/auth'
import { getClienteAllMemberships } from '@/modules/cliente/queries'
import { getNovedadesInicio, getOnboardingCliente } from '@/modules/social/queries'
import { MembershipCard } from '@/components/cliente/MembershipCard'
import { FeedNovedades } from '@/components/cliente/FeedNovedades'
import { OnboardingClienteFirstVisit } from '@/components/cliente/OnboardingClienteFirstVisit'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Mis Membresías',
  description: 'Administra todas tus membresías en un solo lugar',
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

  const cookieStore = await cookies()
  const onboardingSeen = cookieStore.has('membego_onboarding_seen')

  // Feed de novedades y onboarding (fallan en silencio: son secundarios).
  const [novedades, onboarding] = user.metadata.dbUserId
    ? await Promise.all([
        getNovedadesInicio(user.metadata.dbUserId),
        onboardingSeen
          ? Promise.resolve(null)
          : getOnboardingCliente(user.metadata.dbUserId, user.supabaseId).catch(
              () => null
            ),
      ])
    : [[], null]

  return (
    <main className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-h1 text-foreground">Mis membresías</h1>
          <p className="mt-1 text-small text-muted-foreground">
            Tus membresías digitales y sus códigos QR, en un solo lugar.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/cliente/explorar">
            <Compass className="mr-2 h-4 w-4" />
            Explorar más empresas
          </Link>
        </Button>
      </div>

      {/* Onboarding B2C: solo la primera visita */}
      {onboarding && (
        <div className="mb-6">
          <OnboardingClienteFirstVisit onboarding={onboarding} />
        </div>
      )}

      {loadError ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium text-foreground">
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
        <div className="space-y-6">
        <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CreditCard className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Aún no tienes membresías</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Explora las empresas disponibles y activa tu primera membresía para
              empezar a disfrutar beneficios.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/cliente/explorar">Explorar Empresas</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/cliente/promociones">Ver Promociones</Link>
            </Button>
          </div>
        </div>
        <FeedNovedades novedades={novedades} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {memberships.map((membership) => (
              <MembershipCard key={membership.id} membership={membership} />
            ))}
          </div>

          {/* Feed de novedades de empresas seguidas */}
          <FeedNovedades novedades={novedades} />

          {/* CTA to explore more */}
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-gradient-to-br from-sky-50 to-blue-50 p-6 text-center">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-900">¿Quieres más beneficios?</h3>
              <p className="mt-1 text-sm text-slate-600">
                Descubre otras empresas y sus promociones exclusivas.
              </p>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/cliente/explorar">Explorar más empresas</Link>
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
