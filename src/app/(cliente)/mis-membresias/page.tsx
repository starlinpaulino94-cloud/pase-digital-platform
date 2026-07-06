import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getClienteAllMemberships } from '@/modules/cliente/queries'
import { MembershipCard } from '@/components/cliente/MembershipCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Mis Membresías',
  description: 'Administra todas tus membresías en un solo lugar',
}

export default async function MisMembresias() {
  const user = await getUser()
  if (!user || !user.supabaseId) {
    redirect('/auth/login')
  }

  console.log('[mis-membresias] Loading memberships for supabaseId:', user.supabaseId)
  let memberships: Awaited<ReturnType<typeof getClienteAllMemberships>> = []
  try {
    memberships = await getClienteAllMemberships(user.supabaseId)
    console.log('[mis-membresias] Found memberships:', memberships.length)
  } catch (error) {
    console.error('[mis-membresias] Error loading memberships:', error instanceof Error ? error.message : String(error))
  }

  return (
    <main className="container max-w-4xl py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Membresías</h1>
          <p className="text-muted-foreground">
            Administra todas tus membresías y accede a tus códigos QR
          </p>
        </div>
        <Link href="/empresas">
          <Button variant="outline">
            Explorar más empresas
          </Button>
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="border rounded-lg p-8 text-center space-y-4">
          <p className="text-muted-foreground">No tienes ninguna membresía aún.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/empresas">
              <Button>Explorar Empresas</Button>
            </Link>
            <Link href="/promociones">
              <Button variant="outline">Ver Promociones</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4">
            {memberships.map((membership) => (
              <MembershipCard key={membership.id} membership={membership} />
            ))}
          </div>

          {/* CTA to explore more */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="font-semibold text-neutral-900 mb-2">
              ¿Quieres más beneficios?
            </h3>
            <p className="text-neutral-600 text-sm mb-4">
              Descubre otras empresas y sus promociones exclusivas
            </p>
            <Link href="/empresas">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Explorar más empresas
              </Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
