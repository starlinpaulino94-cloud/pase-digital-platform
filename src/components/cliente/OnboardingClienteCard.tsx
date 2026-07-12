import Link from 'next/link'
import { CheckCircle2, Circle, Sparkles, ArrowRight } from 'lucide-react'
import type { OnboardingCliente } from '@/modules/social/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/** F5.2: checklist de onboarding del cliente en su pantalla de inicio. */
export function OnboardingClienteCard({ onboarding }: { onboarding: OnboardingCliente }) {
  // Completo: no molestar.
  if (onboarding.completados === onboarding.total) return null

  const pct = Math.round((onboarding.completados / onboarding.total) * 100)

  return (
    <Card className="border-info/30 bg-info/10">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base text-info">
            <Sparkles className="h-5 w-5 text-primary" />
            Saca el máximo a MembeGo
          </CardTitle>
          <span className="text-sm font-semibold text-info">
            {onboarding.completados}/{onboarding.total}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-info/15">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {onboarding.items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-3 rounded-lg bg-card p-2.5 text-sm shadow-sm"
          >
            <span className="flex items-center gap-2">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <span className={item.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                {item.label}
              </span>
            </span>
            {!item.done && item.cta && (
              <Link href={item.href}>
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  {item.cta} <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        ))}

        <div className="pt-1 text-right">
          <Link
            href="/cliente/bienvenida"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver guía paso a paso <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
