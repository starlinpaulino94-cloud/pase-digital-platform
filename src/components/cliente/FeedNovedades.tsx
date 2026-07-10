import Link from 'next/link'
import {
  Megaphone,
  CalendarDays,
  Newspaper,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NovedadInicio } from '@/modules/social/queries'

const TIPO_META: Record<string, { label: string; icon: LucideIcon; chip: string }> = {
  PROMOCION: { label: 'Promoción', icon: Megaphone, chip: 'bg-blue-100 text-blue-700' },
  EVENTO: { label: 'Evento', icon: CalendarDays, chip: 'bg-violet-100 text-violet-700' },
  NOTICIA: { label: 'Noticia', icon: Newspaper, chip: 'bg-sky-100 text-sky-700' },
  BENEFICIO: { label: 'Beneficio', icon: BadgeCheck, chip: 'bg-emerald-100 text-emerald-700' },
}

function fmtFecha(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'medium' }).format(new Date(d))
}

/** Feed compacto de novedades de las empresas que el cliente sigue. */
export function FeedNovedades({ novedades }: { novedades: NovedadInicio[] }) {
  if (novedades.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Novedades de tus empresas
          </h2>
          <p className="text-sm text-slate-500">
            Lo último de las empresas que sigues.
          </p>
        </div>
        <Link
          href="/cliente/promociones"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Ver todo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {novedades.map((n) => {
          const meta = TIPO_META[n.tipo] ?? TIPO_META.NOTICIA
          return (
            <Link
              key={`${n.tipo}-${n.id}`}
              href={n.href}
              className="flex items-center gap-4 p-4 transition hover:bg-slate-50"
            >
              <div className={`rounded-xl p-2.5 ${meta.chip}`}>
                <meta.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{n.titulo}</p>
                <p className="text-xs text-slate-500">
                  {n.companyName} · {meta.label}
                  {n.tipo === 'EVENTO' ? ` · ${fmtFecha(n.fecha)}` : ''}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
