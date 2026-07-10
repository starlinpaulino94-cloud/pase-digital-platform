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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  /** O-13: beneficio de bienvenida YA validado como elegible por el servidor. */
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {planes.map((plan, idx) => {
        const isCurrent = plan.id === currentPlanId
        const isRequested = plan.id === requestedPlanId
        const isFeatured = !isCurrent && idx === 1
        const isUpgrade = currentPlanPrecio != null && plan.precio > currentPlanPrecio
        const isDowngrade = currentPlanPrecio != null && plan.precio < currentPlanPrecio
        // O-13: precio con el beneficio de bienvenida (solo primera membresía).
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
          <Card
            key={plan.id}
            className={cn(
              'relative flex flex-col',
              isCurrent && 'border-emerald-300 ring-1 ring-emerald-200',
              isFeatured && !isCurrent && 'border-sky-300 shadow-lg ring-1 ring-sky-200'
            )}
          >
            {isCurrent && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                  <Check className="mr-1 h-3 w-3" /> Tu plan actual
                </Badge>
              </div>
            )}
            {isFeatured && !isCurrent && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-sky-500 text-white hover:bg-sky-500">
                  <Star className="mr-1 h-3 w-3" /> Más popular
                </Badge>
              </div>
            )}

            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {plan.esIlimitado ? (
                    <Crown className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-sky-500" />
                  )}
                  {plan.nombre}
                </CardTitle>
                {plan.esIlimitado && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    Ilimitado
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col space-y-4">
              <div>
                {descuento > 0 ? (
                  <>
                    <p className="text-sm text-slate-400 line-through">
                      {formatMoney(plan.precio, prefs)}
                    </p>
                    <p className="text-3xl font-extrabold text-slate-900">
                      {formatMoney(precioFinal, prefs)}
                      <span className="text-base font-normal text-slate-400">/mes</span>
                    </p>
                    <Badge variant="success" className="mt-1 gap-1">
                      <Gift className="h-3 w-3" />
                      Bienvenida: −{formatMoney(descuento, prefs)} en tu primer pago
                    </Badge>
                  </>
                ) : (
                  <p className="text-3xl font-extrabold text-slate-900">
                    {formatMoney(plan.precio, prefs)}
                    <span className="text-base font-normal text-slate-400">/mes</span>
                  </p>
                )}
                {plan.descripcion && (
                  <p className="mt-2 text-sm text-slate-500">{plan.descripcion}</p>
                )}
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-700">
                  {plan.esIlimitado
                    ? 'Usos ilimitados'
                    : `${plan.lavadosIncluidos} usos incluidos`}
                </p>
                <p className="text-xs text-slate-500">
                  Vigencia: {plan.vigenciaDias} días
                </p>
              </div>

              {plan.beneficios.length > 0 && (
                <ul className="space-y-2">
                  {plan.beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto pt-2">
                {isCurrent ? (
                  <Button disabled variant="outline" className="w-full">
                    Plan actual
                  </Button>
                ) : isRequested ? (
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700"
                    onClick={() =>
                      activeMembershipId && router.push(`/membresia/${activeMembershipId}`)
                    }
                  >
                    Cambio solicitado · subir comprobante
                  </Button>
                ) : hasActive ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={isFeatured ? 'default' : 'outline'}
                        className={cn('w-full', isFeatured && 'bg-sky-500 hover:bg-sky-400')}
                      >
                        {isUpgrade && <ArrowUpCircle className="mr-2 h-4 w-4" />}
                        {isDowngrade && <ArrowDownCircle className="mr-2 h-4 w-4" />}
                        {isUpgrade ? 'Subir a este plan' : isDowngrade ? 'Bajar a este plan' : 'Cambiar a este plan'}
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
                      className={cn('w-full', isFeatured && 'bg-sky-500 hover:bg-sky-400')}
                    >
                      Quiero este plan
                    </SubmitButton>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
