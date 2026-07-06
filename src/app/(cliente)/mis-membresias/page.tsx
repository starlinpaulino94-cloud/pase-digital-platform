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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Membresías</h1>
        <p className="text-muted-foreground">
          Administra todas tus membresías y accede a tus códigos QR
        </p>
      </div>

      {memberships.length === 0 ? (
        <div className="border rounded-lg p-8 text-center space-y-4">
          <p className="text-muted-foreground">No tienes ninguna membresía aún.</p>
          <Link href="/registrarse">
            <Button>Crear Mi Primera Membresía</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {memberships.map((membership) => (
            <MembershipCard key={membership.id} membership={membership} />
          ))}
        </div>
      )}
    </main>
  )
}
