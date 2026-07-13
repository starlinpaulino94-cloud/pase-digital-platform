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
  PROMOCION: { label: 'Promoción', icon: Megaphone, chip: 'bg-info/15 text-info' },
  EVENTO: { label: 'Evento', icon: CalendarDays, chip: 'bg-primary/10 text-primary' },
  NOTICIA: { label: 'Noticia', icon: Newspaper, chip: 'bg-info/10 text-info' },
  BENEFICIO: { label: 'Beneficio', icon: BadgeCheck, chip: 'bg-success/15 text-success' },
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
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Novedades de tus empresas
          </h2>
          <p className="text-sm text-muted-foreground">
            Lo último de las empresas que sigues.
          </p>
        </div>
        <Link
          href="/cliente/promociones"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-primary transition hover:bg-primary/10"
        >
          Ver todo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
        {novedades.map((n) => {
          const meta = TIPO_META[n.tipo] ?? TIPO_META.NOTICIA
          return (
            <Link
              key={`${n.tipo}-${n.id}`}
              href={n.href}
              className="group flex items-center gap-4 p-4 transition hover:bg-muted/60"
            >
              <div className={`shrink-0 rounded-xl p-2.5 ${meta.chip}`}>
                <meta.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{n.titulo}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="truncate">{n.companyName}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${meta.chip}`}>
                    {meta.label}
                  </span>
                  {n.tipo === 'EVENTO' && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      {fmtFecha(n.fecha)}
                    </>
                  )}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
