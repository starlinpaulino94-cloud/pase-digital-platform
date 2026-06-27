import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

// Protects all routes under (admin)/ — SUPERADMIN only.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) redirect('/login')
  if (session.role !== 'SUPERADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  )
}
