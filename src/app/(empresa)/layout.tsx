import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

// Protects all routes under (empresa)/ — requires operator access.
// Role-specific page-level checks are done inside each page/component.
export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const allowed = ['SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO'] as const
  if (!allowed.includes(session.role as (typeof allowed)[number])) {
    redirect('/profile')
  }

  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  )
}
