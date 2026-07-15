'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import {
  Check,
  Gift,
  Sparkles,
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
import {
  planRecomendadoPara,
  beneficiosSinRedundancia,
  type VehiculoLite,
} from '@/lib/vehiculoPlan'
import { VehicleSelector } from '@/components/cliente/VehicleSelector'
import { MobilePlanTabs } from '@/components/cliente/MobilePlanTabs'
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
  /** Vehículos registrados del cliente: activan la recomendación automática. */
  vehiculos?: VehiculoLite[]
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

/**
 * Destello premium MUY lento (8s) que recorre la tarjeta recomendada para
 * captar la atención con elegancia, sin molestar.
 */
function ShineCard() {
  return (
    <span
      aria-hidden
      className="animate-shimmer pointer-events-none absolute inset-0 z-10 rounded-3xl bg-[linear-gradient(110deg,transparent_38%,rgba(255,255,255,0.16)_50%,transparent_62%)] bg-[length:200%_100%] [animation-duration:8s]"
    />
  )
}

/**
 * Grid de planes rediseñado (Stripe/Apple):
 * - Cabecera contextual: recomendación automática según el vehículo del
 *   cliente (VehicleSelector si tiene varios).
 * - Smart dimming: el plan recomendado destaca; el resto baja a opacity-65
 *   con transición suave (siguen 100% comprables y accesibles).
 * - Precios en tipografía sobria (text-foreground), sin degradados llamativos:
 *   el gradiente de marca queda solo para el badge recomendado y el CTA.
 * - Tabs móviles: en teléfono se ve una tarjeta a la vez.
 */
export function PlanesGrid({
  planes,
  currentPlanId,
  requestedPlanId,
  hasActive,
  activeMembershipId,
  currentPlanPrecio,
  prefs,
  bienvenida = null,
  vehiculos = [],
}: Props) {
  const router = useRouter()
  const init: SeleccionState = {}
  const [selectState, selectAction] = useActionState(seleccionarPlan, init)
  const [changeState, changeAction] = useActionState(solicitarCambioPlan, init)

  // Vehículo activo → plan recomendado (null si ningún plan lo menciona).
  const [vehiculoId, setVehiculoId] = useState(vehiculos[0]?.id ?? '')
  const vehiculo = vehiculos.find((v) => v.id === vehiculoId) ?? null
  const recomendadoId = useMemo(
    () => (vehiculo ? planRecomendadoPara(vehiculo, planes) : null),
    [vehiculo, planes]
  )

  // Tab móvil activa: el recomendado > el plan actual > el primero.
  const [tabId, setTabId] = useState(
    () => recomendadoId ?? currentPlanId ?? planes[0]?.id ?? ''
  )
  // Al cambiar de vehículo, la tab salta al nuevo recomendado (ajuste de
  // estado durante el render, patrón recomendado por React para derivar de props).
  const [prevRecomendado, setPrevRecomendado] = useState(recomendadoId)
  if (recomendadoId !== prevRecomendado) {
    setPrevRecomendado(recomendadoId)
    if (recomendadoId) setTabId(recomendadoId)
  }

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

  const tabs = planes.map((p) => {
    const { base, variante } = parseNombre(p.nombre)
    return { id: p.id, label: variante ?? base }
  })

  return (
    <div>
      {/* Contexto inteligente: para qué vehículo estamos recomendando */}
      {vehiculo && (
        <div className="animate-fade-up mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>Planes para tu</span>
          <VehicleSelector
            vehiculos={vehiculos}
            selectedId={vehiculoId}
            onSelect={setVehiculoId}
            className="text-sm"
          />
          {recomendadoId ? (
            <span>· te sugerimos el plan compatible</span>
          ) : (
            <span>· elige el plan según el tamaño de tu vehículo</span>
          )}
        </div>
      )}

      {/* Tabs solo en móvil: una tarjeta a la vez, menos scroll */}
      <MobilePlanTabs tabs={tabs} activeId={tabId} onChange={setTabId} />

      <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
        {planes.map((plan, idx) => {
          const isCurrent = plan.id === currentPlanId
          const isRequested = plan.id === requestedPlanId
          // Recomendación: por vehículo si hay match; sin vehículos, cae al
          // destacado de marketing clásico (tarjeta central).
          const isRecommended =
            recomendadoId != null
              ? plan.id === recomendadoId && !isCurrent
              : vehiculos.length === 0 && !isCurrent && idx === 1
          // Smart dimming: solo cuando HAY un recomendado real por vehículo.
          const isDimmed = recomendadoId != null && plan.id !== recomendadoId && !isCurrent
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
          const beneficios = beneficiosSinRedundancia(plan.beneficios)

          return (
            <div
              key={plan.id}
              className={cn(
                'group relative flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition-all duration-300',
                'animate-fade-up',
                DELAYS[idx % DELAYS.length],
                // Tabs móviles: solo la tarjeta activa es visible en teléfono.
                tabId === plan.id ? 'flex' : 'hidden md:flex',
                isCurrent
                  ? 'border-success/40 ring-2 ring-success/20'
                  : isRecommended
                    ? 'z-10 border-transparent shadow-premium ring-2 ring-primary/35 lg:-translate-y-2'
                    : 'border-border/70 hover:-translate-y-1 hover:shadow-premium',
                isDimmed && 'opacity-65 hover:opacity-100'
              )}
            >
              {isRecommended && <ShineCard />}

              {/* Badges de estado */}
              {isCurrent && (
                <div className="absolute right-4 top-4 z-20">
                  <Badge className="gap-1 bg-success/15 text-success hover:bg-success/15">
                    <Check className="h-3 w-3" /> Tu plan
                  </Badge>
                </div>
              )}
              {isRecommended && (
                <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-b-xl bg-gradient-to-r from-primary to-sky-500 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow">
                    <Sparkles className="h-3 w-3" />
                    {vehiculo && recomendadoId
                      ? `Para tu ${titleCase(vehiculo.modelo)}`
                      : 'Recomendado'}
                  </span>
                </div>
              )}

              <div className={cn('relative flex flex-1 flex-col p-6', isRecommended && 'pt-10')}>
                {/* 1 · Cabecera: nombre + variante + precio sobrio */}
                <div className="mb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-extrabold leading-tight tracking-tight text-foreground">
                      {base}
                    </h3>
                    {variante && (
                      <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {variante}
                      </span>
                    )}
                    {plan.esIlimitado && (
                      <span className="inline-flex rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">
                        Ilimitado
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    {descuento > 0 && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatMoney(plan.precio, prefs)}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[2.5rem] font-extrabold leading-none tracking-tight text-foreground">
                        {formatMoney(precioFinal, prefs)}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">/mes</span>
                    </div>
                    {precioPorUso != null && (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-success">
                        <Zap className="h-3.5 w-3.5 fill-current" />
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
                </div>

                {/* 2 · Métricas de vigencia: pastillas ultra-limpias */}
                <div className="mb-5 flex gap-2 border-y border-border/50 py-3.5">
                  <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" />
                    {plan.esIlimitado ? 'Usos ilimitados' : `${plan.lavadosIncluidos} usos`}
                  </span>
                  <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {plan.vigenciaDias} días
                  </span>
                </div>

                {/* 3 · Lo que incluye el servicio (sin repetir usos/ahorro) */}
                {beneficios.length > 0 && (
                  <ul className="mb-4 space-y-2.5">
                    {beneficios.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/80">
                        <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-success/12">
                          <Check className="h-3 w-3 text-success" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Modelos compatibles: referencia secundaria, ya no es la única
                    forma de saber si el auto cabe (la recomendación es automática). */}
                {plan.descripcion && (
                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
                    {plan.descripcion}
                  </p>
                )}

                {/* Aviso explícito de compatibilidad (a11y: visible y legible,
                    la tarjeta sigue siendo comprable) */}
                {isDimmed && (
                  <p className="mb-3 text-[11px] font-medium text-muted-foreground">
                    Pensado para otro tamaño de vehículo — también puedes elegirlo.
                  </p>
                )}

                {/* CTA — anclado abajo, targets ≥48px */}
                <div className="mt-auto pt-1">
                  {isCurrent ? (
                    <Button disabled variant="outline" className="min-h-12 w-full">
                      <Check className="mr-2 h-4 w-4" />
                      Este es tu plan
                    </Button>
                  ) : isRequested ? (
                    <Button
                      variant="outline"
                      className="min-h-12 w-full border-warning/30 text-warning-foreground"
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
                          className={cn(
                            'min-h-12 w-full font-bold text-white shadow-md transition hover:opacity-95',
                            isUpgrade
                              ? 'bg-amber-500 hover:bg-amber-500'
                              : isDowngrade
                                ? 'bg-sky-600 hover:bg-sky-600'
                                : 'bg-foreground text-background hover:bg-foreground'
                          )}
                        >
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
                        className={cn(
                          'min-h-12 w-full font-bold shadow-md transition hover:opacity-95',
                          isRecommended
                            ? 'bg-gradient-to-r from-primary to-sky-500 text-white shadow-glow'
                            : 'bg-foreground text-background hover:bg-foreground'
                        )}
                      >
                        Seleccionar este plan
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
