'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import {
  Check,
  Crown,
  Gift,
  Sparkles,
  Star,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Zap,
  Calendar,
} from 'lucide-react'
import {
  seleccionarPlan,
  solicitarCambioPlan,
  type SeleccionState,
} from '@/modules/membresia/actions'
import { cn } from '@/lib/utils'
import { formatMoney, type RegionalPrefs } from '@/lib/format'
import { calcularDescuentoBienvenida } from '@/lib/bienvenida'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export interface PlanItem {
  id: string
  nombre: string
  precio: number
  esIlimitado: boolean
  descripcion: string | null
  lavadosIncluidos: number
  beneficios: string[]
  vigenciaDias: number
}

interface Props {
  planes: PlanItem[]
  currentPlanId: string | null
  requestedPlanId: string | null
  hasActive: boolean
  activeMembershipId: string | null
  currentPlanPrecio: number | null
  prefs?: RegionalPrefs | null
  bienvenida?: { tipo: string; valor: number } | null
}

/**
 * "PLAN SILVER (SUV PEQ)" → título "Plan Silver" + variante "SUV PEQ".
 * Los nombres con paréntesis se truncaban feo; la variante ahora es un chip.
 */
function parseNombre(nombre: string): { base: string; variante: string | null } {
  const m = nombre.match(/^(.*?)\s*[([](.+?)[)\]]\s*$/)
  if (!m) return { base: titleCase(nombre), variante: null }
  return { base: titleCase(m[1].trim()), variante: m[2].trim() }
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase())
}

/** Escalonado de entrada por posición de la tarjeta. */
const DELAYS = ['', 'delay-100', 'delay-200', 'delay-300'] as const

function SubmitButton({
  children,
  variant,
  className,
}: {
  children: React.ReactNode
  variant?: 'default' | 'outline'
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} variant={variant} className={className}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}

/** Brillo que recorre el CTA del plan recomendado. */
function Shine() {
  return (
    <span
      aria-hidden
      className="animate-shimmer pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] bg-[length:200%_100%]"
    />
  )
}

export function PlanesGrid({
  planes,
  currentPlanId,
  requestedPlanId,
  hasActive,
  activeMembershipId,
  currentPlanPrecio,
  prefs,
  bienvenida = null,
}: Props) {
  const router = useRouter()
  const init: SeleccionState = {}
  const [selectState, selectAction] = useActionState(seleccionarPlan, init)
  const [changeState, changeAction] = useActionState(solicitarCambioPlan, init)

  useEffect(() => {
    const st = selectState.success ? selectState : changeState.success ? changeState : null
    if (st?.success && st.membershipId) {
      toast.success(
        hasActive ? 'Cambio solicitado. Sube tu comprobante.' : 'Plan seleccionado. Sube tu comprobante.'
      )
      router.push(`/membresia/${st.membershipId}`)
    }
    if (selectState.error) toast.error(selectState.error)
    if (changeState.error) toast.error(changeState.error)
  }, [selectState, changeState, hasActive, router])

  return (
    <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
      {planes.map((plan, idx) => {
        const isCurrent = plan.id === currentPlanId
        const isRequested = plan.id === requestedPlanId
        const isFeatured = !isCurrent && idx === 1
        const isUpgrade = currentPlanPrecio != null && plan.precio > currentPlanPrecio
        const isDowngrade = currentPlanPrecio != null && plan.precio < currentPlanPrecio
        const descuento =
          !hasActive && bienvenida
            ? calcularDescuentoBienvenida(
                {
                  bienvenidaActiva: true,
                  bienvenidaTipo: bienvenida.tipo,
                  bienvenidaValor: bienvenida.valor,
                },
                plan.precio
              )
            : 0
        const precioFinal = Math.max(0, plan.precio - descuento)
        const { base, variante } = parseNombre(plan.nombre)
        // Ancla de valor: cuánto sale cada uso (fuerte motivador de compra).
        const precioPorUso =
          !plan.esIlimitado && plan.lavadosIncluidos > 0
            ? Math.round(precioFinal / plan.lavadosIncluidos)
            : null

        return (
          <div
            key={plan.id}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition-all duration-300',
              'animate-fade-up',
              DELAYS[idx % DELAYS.length],
              isCurrent
                ? 'border-success/30 ring-2 ring-success/15'
                : isFeatured
                  ? 'z-10 border-primary/40 bg-gradient-to-b from-primary/[0.05] to-card shadow-premium ring-2 ring-primary/20 lg:-translate-y-2 lg:hover:-translate-y-3'
                  : 'border-border/70 hover:-translate-y-1 hover:border-primary/25 hover:shadow-premium'
            )}
          >
            {/* Barra de acento superior */}
            <div
              className={cn(
                'h-1.5',
                isCurrent
                  ? 'bg-success'
                  : isFeatured
                    ? 'bg-gradient-to-r from-primary via-sky-400 to-info'
                    : 'bg-transparent'
              )}
            />

            {/* Badges de estado */}
            {isCurrent && (
              <div className="absolute right-4 top-4 z-10">
                <Badge className="gap-1 bg-success/15 text-success hover:bg-success/15">
                  <Check className="h-3 w-3" /> Tu plan
                </Badge>
              </div>
            )}
            {isFeatured && !isCurrent && (
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-b-xl bg-gradient-to-r from-primary to-info px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow">
                  <Star className="h-3 w-3 fill-current" />
                  Recomendado
                </span>
              </div>
            )}

            <div className={cn('flex flex-1 flex-col p-6', isFeatured && 'pt-8')}>
              {/* Encabezado del plan */}
              <div className="mb-5">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                      plan.esIlimitado
                        ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-sm'
                        : isFeatured
                          ? 'bg-gradient-to-br from-primary to-info text-white shadow-sm'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {plan.esIlimitado ? (
                      <Crown className="h-5.5 w-5.5" />
                    ) : (
                      <Sparkles className="h-5.5 w-5.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold leading-tight tracking-tight text-foreground">
                      {base}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {variante && (
                        <span
                          className={cn(
                            'inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            isFeatured
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {variante}
                        </span>
                      )}
                      {plan.esIlimitado && (
                        <span className="inline-flex rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">
                          Ilimitado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {plan.descripcion && (
                  <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                    {plan.descripcion}
                  </p>
                )}
              </div>

              {/* Precio */}
              <div className="mb-5">
                {descuento > 0 && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatMoney(plan.precio, prefs)}
                  </p>
                )}
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      'text-4xl font-extrabold tracking-tight',
                      isFeatured
                        ? 'bg-gradient-to-r from-primary to-info bg-clip-text text-transparent'
                        : 'text-foreground'
                    )}
                  >
                    {formatMoney(precioFinal, prefs)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">/mes</span>
                </div>
                {precioPorUso != null && (
                  <p className="mt-1 text-xs font-semibold text-success">
                    Sale a {formatMoney(precioPorUso, prefs)} por uso
                  </p>
                )}
                {descuento > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                    <Gift className="h-3.5 w-3.5" />
                    −{formatMoney(descuento, prefs)} bienvenida
                  </div>
                )}
              </div>

              {/* Métricas clave */}
              <div className="mb-5 flex gap-2">
                <div
                  className={cn(
                    'flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5',
                    isFeatured ? 'bg-primary/[0.07]' : 'bg-muted/60'
                  )}
                >
                  <Zap
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isFeatured ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {plan.esIlimitado ? 'Ilimitados' : `${plan.lavadosIncluidos} usos`}
                  </span>
                </div>
                <div
                  className={cn(
                    'flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5',
                    isFeatured ? 'bg-primary/[0.07]' : 'bg-muted/60'
                  )}
                >
                  <Calendar
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isFeatured ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {plan.vigenciaDias} días
                  </span>
                </div>
              </div>

              {/* Beneficios */}
              {plan.beneficios.length > 0 && (
                <ul className="mb-6 space-y-2.5">
                  {plan.beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-success/12">
                        <Check className="h-3 w-3 text-success" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA — anclado abajo */}
              <div className="mt-auto pt-1">
                {isCurrent ? (
                  <Button disabled variant="outline" className="w-full">
                    <Check className="mr-2 h-4 w-4" />
                    Este es tu plan
                  </Button>
                ) : isRequested ? (
                  <Button
                    variant="outline"
                    className="w-full border-warning/30 text-warning-foreground"
                    onClick={() =>
                      activeMembershipId && router.push(`/membresia/${activeMembershipId}`)
                    }
                  >
                    Cambio solicitado
                  </Button>
                ) : hasActive ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={isFeatured ? 'default' : 'outline'}
                        className={cn(
                          'w-full font-bold',
                          isFeatured &&
                            'relative overflow-hidden bg-gradient-to-r from-primary to-info text-white shadow-glow hover:opacity-95'
                        )}
                      >
                        {isFeatured && <Shine />}
                        {isUpgrade && <ArrowUpCircle className="mr-2 h-4 w-4" />}
                        {isDowngrade && <ArrowDownCircle className="mr-2 h-4 w-4" />}
                        {isUpgrade ? 'Subir a este plan' : isDowngrade ? 'Bajar a este plan' : 'Cambiar de plan'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Cambiar al plan {plan.nombre}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tu plan actual seguirá activo. Para aplicar el cambio deberás
                          subir el comprobante del nuevo plan ({formatMoney(plan.precio, prefs)}) y
                          el equipo lo aprobará. ¿Continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <form action={changeAction}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <AlertDialogAction type="submit">
                            Sí, solicitar cambio
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <form action={selectAction}>
                    <input type="hidden" name="planId" value={plan.id} />
                    <SubmitButton
                      variant={isFeatured ? 'default' : 'outline'}
                      className={cn(
                        'w-full font-bold',
                        isFeatured &&
                          'relative overflow-hidden bg-gradient-to-r from-primary to-info py-5 text-white shadow-glow hover:opacity-95'
                      )}
                    >
                      {isFeatured && <Shine />}
                      Quiero este plan
                    </SubmitButton>
                  </form>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
