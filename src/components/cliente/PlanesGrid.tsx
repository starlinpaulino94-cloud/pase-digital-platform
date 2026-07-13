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
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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

        return (
          <div
            key={plan.id}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all',
              isCurrent
                ? 'border-success/30 ring-2 ring-success/15'
                : isFeatured
                  ? 'border-primary/30 ring-2 ring-primary/15 shadow-premium'
                  : 'border-border/70 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-premium'
            )}
          >
            {/* Top accent bar */}
            {(isCurrent || isFeatured) && (
              <div
                className={cn(
                  'h-1',
                  isCurrent ? 'bg-success' : 'bg-gradient-to-r from-primary to-info'
                )}
              />
            )}

            {/* Badge flotante */}
            {isCurrent && (
              <div className="absolute right-3 top-3 z-10">
                <Badge className="gap-1 bg-success/15 text-success hover:bg-success/15">
                  <Check className="h-3 w-3" /> Actual
                </Badge>
              </div>
            )}
            {isFeatured && !isCurrent && (
              <div className="absolute right-3 top-3 z-10">
                <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                  <Star className="h-3 w-3" /> Popular
                </Badge>
              </div>
            )}

            <div className="flex flex-1 flex-col p-5">
              {/* Plan header */}
              <div className="mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      plan.esIlimitado
                        ? 'bg-warning/12 text-warning-foreground'
                        : isFeatured
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {plan.esIlimitado ? (
                      <Crown className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-foreground">
                      {plan.nombre}
                    </h3>
                    {plan.esIlimitado && (
                      <p className="text-xs font-medium text-warning-foreground">Ilimitado</p>
                    )}
                  </div>
                </div>
                {plan.descripcion && (
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {plan.descripcion}
                  </p>
                )}
              </div>

              {/* Pricing */}
              <div className="mb-5">
                {descuento > 0 ? (
                  <div>
                    <p className="text-sm text-muted-foreground line-through">
                      {formatMoney(plan.precio, prefs)}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight text-foreground">
                        {formatMoney(precioFinal, prefs)}
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                      <Gift className="h-3.5 w-3.5" />
                      −{formatMoney(descuento, prefs)} bienvenida
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">
                      {formatMoney(plan.precio, prefs)}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">/mes</span>
                  </div>
                )}
              </div>

              {/* Key metrics */}
              <div className="mb-5 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
                  <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {plan.esIlimitado ? 'Ilimitados' : `${plan.lavadosIncluidos} usos`}
                  </span>
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {plan.vigenciaDias} días
                  </span>
                </div>
              </div>

              {/* Benefits */}
              {plan.beneficios.length > 0 && (
                <ul className="mb-5 space-y-2">
                  {plan.beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-success/12">
                        <Check className="h-3 w-3 text-success" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA — pinned to bottom */}
              <div className="mt-auto pt-1">
                {isCurrent ? (
                  <Button disabled variant="outline" className="w-full">
                    Plan actual
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
                          'w-full',
                          isFeatured && 'shadow-glow'
                        )}
                      >
                        {isUpgrade && <ArrowUpCircle className="mr-2 h-4 w-4" />}
                        {isDowngrade && <ArrowDownCircle className="mr-2 h-4 w-4" />}
                        {isUpgrade ? 'Subir plan' : isDowngrade ? 'Bajar plan' : 'Cambiar plan'}
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
                        'w-full',
                        isFeatured && 'shadow-glow'
                      )}
                    >
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
