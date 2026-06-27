import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

// Protects all routes under (customer)/ — CLIENTE only.
// SUPERADMIN is also allowed for impersonation/support.
export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect('/login')

  const allowed = ['SUPERADMIN', 'CLIENTE'] as const
  if (!allowed.includes(session.role as (typeof allowed)[number])) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  )
}
