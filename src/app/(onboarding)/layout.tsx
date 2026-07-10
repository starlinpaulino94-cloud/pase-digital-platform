import { requireRole } from '@/lib/auth/guards'
import { FULL_ADMIN_ROLES } from '@/types'

/**
 * Layout del asistente de onboarding (Fase 2B). Enfocado y sin la barra
 * lateral del panel: el objetivo es guiar paso a paso, no distraer.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(FULL_ADMIN_ROLES)
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2.5 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="MembeGo" width={32} height={32} />
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            Membe<span className="text-emerald-500">Go</span>
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">{children}</main>
    </div>
  )
}
