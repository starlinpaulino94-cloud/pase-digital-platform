import Link from 'next/link'
import { CheckCircle2, ArrowRight, Rocket, PartyPopper, Users } from 'lucide-react'
import type { OnboardingEmpresa } from '@/modules/empresas/onboarding'
import { Button } from '@/components/ui/button'
import { PublicarEmpresaButton } from '@/components/admin/PublicarEmpresaButton'

/**
 * Asistente guiado de configuración de empresa (Fase 2B). Presenta los pasos
 * como un flujo numerado con un paso "actual" (el primero pendiente) y CTAs
 * hacia los módulos existentes. El progreso se deriva de los datos reales
 * (getOnboardingEmpresa), así que el usuario puede abandonar y retomar sin
 * perder nada. La publicación en el marketplace sigue siendo el gate final.
 */
export function WizardEmpresa({
  onboarding,
  companyName,
}: {
  onboarding: OnboardingEmpresa
  companyName: string
}) {
  const pct = Math.round((onboarding.completados / onboarding.total) * 100)
  const currentIndex = onboarding.items.findIndex((i) => !i.done)

  // Caso final: publicada y completa.
  if (onboarding.publicado && onboarding.listoParaPublicar) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <PartyPopper className="mx-auto h-10 w-10 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          ¡{companyName} está lista!
        </h1>
        <p className="mt-2 text-slate-600">
          Tu empresa está publicada en el marketplace y tu perfil está completo.
        </p>
        <Link href="/admin/dashboard" className="mt-6 inline-block">
          <Button className="gap-1.5">
            Ir a mi panel <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">Configura tu empresa</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Terminemos de preparar {companyName}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Completa estos pasos para publicar tu empresa en el marketplace. Puedes
          salir y retomar cuando quieras: tu progreso se guarda solo.
        </p>
      </div>

      {/* Progreso */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            Progreso: {onboarding.completados} de {onboarding.total}
          </span>
          <span className="text-sm font-semibold text-indigo-600">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Pasos */}
      <ol className="space-y-3">
        {onboarding.items.map((item, i) => {
          const isCurrent = i === currentIndex
          return (
            <li
              key={item.key}
              className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition ${
                isCurrent
                  ? 'border-indigo-300 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      item.done ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}
                  >
                    {item.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-indigo-600">Paso actual</p>
                  )}
                </div>
              </div>
              {!item.done && (
                <Link href={item.href}>
                  <Button
                    size="sm"
                    variant={isCurrent ? 'default' : 'outline'}
                    className="gap-1 text-xs"
                  >
                    {item.cta} <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </li>
          )
        })}
      </ol>

      {/* Paso opcional: equipo (no bloquea la publicación) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 shrink-0 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-800">Invitar a tu equipo</p>
              <p className="text-xs text-slate-500">
                Opcional · puedes hacerlo ahora o más tarde
              </p>
            </div>
          </div>
          <Link href="/admin/empleados">
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              Invitar <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Publicación */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <p className="text-sm text-indigo-800">
              {onboarding.listoParaPublicar
                ? '¡Todo listo! Publica tu empresa para que aparezca en el marketplace.'
                : 'Completa todos los pasos para poder publicar tu empresa.'}
            </p>
          </div>
          <PublicarEmpresaButton habilitado={onboarding.listoParaPublicar} />
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/admin/clientes"
          className="text-sm text-slate-500 underline hover:text-slate-700"
        >
          Explorar mi panel por ahora
        </Link>
      </div>
    </div>
  )
}
