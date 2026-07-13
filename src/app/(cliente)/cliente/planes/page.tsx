import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  CreditCard,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { PlanesGrid, type PlanItem } from '@/components/cliente/PlanesGrid'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Planes',
  description: 'Elige o cambia tu plan de membresía',
}

const PENDIENTE_PAGO_ESTADOS = ['PENDIENTE', 'PENDIENTE_PAGO', 'RECHAZADA']

export default async function PlanesPage() {
  const user = await requireRole('CLIENTE')

  if (!user.metadata.clienteId) {
    return (
      <main className="container max-w-5xl py-8">
        <p className="text-muted-foreground">Tu cuenta no está completamente configurada.</p>
      </main>
    )
  }

  let cliente
  try {
    cliente = await prisma.cliente.findUnique({
      where: { id: user.metadata.clienteId },
      select: {
        id: true,
        company: {
          select: {
            id: true, name: true, moneda: true, idioma: true,
            bienvenidaActiva: true, bienvenidaTipo: true, bienvenidaValor: true,
          },
        },
        memberships: {
          select: {
            id: true,
            estado: true,
            planId: true,
            planIdSolicitado: true,
            fechaInicio: true,
            plan: { select: { nombre: true, precio: true } },
            planSolicitado: { select: { nombre: true } },
          },
          take: 1,
        },
      },
    })
  } catch (e) {
    console.error('[cliente-planes]', e)
    return (
      <main className="container max-w-5xl py-8">
        <p className="text-muted-foreground">No pudimos cargar tu información. Intenta más tarde.</p>
      </main>
    )
  }

  if (!cliente) {
    return (
      <main className="container max-w-5xl py-8">
        <p className="text-muted-foreground">No se encontró tu información.</p>
      </main>
    )
  }

  const planesRaw = await prisma.plan
    .findMany({
      where: { companyId: cliente.company.id, activo: true },
      select: {
        id: true, nombre: true, precio: true, esIlimitado: true,
        descripcion: true, lavadosIncluidos: true, beneficios: true, vigenciaDias: true,
      },
      orderBy: { precio: 'asc' },
    })
    .catch((e) => {
      console.error('[cliente-planes] plans', e)
      return []
    })

  const planes: PlanItem[] = planesRaw.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: Number(p.precio),
    esIlimitado: p.esIlimitado,
    descripcion: p.descripcion,
    lavadosIncluidos: p.lavadosIncluidos,
    beneficios: p.beneficios,
    vigenciaDias: p.vigenciaDias,
  }))

  const membership = cliente.memberships[0] ?? null
  const isActive = membership?.estado === 'ACTIVA'
  const elegibleBienvenida = !membership || membership.fechaInicio == null
  const bienvenida =
    elegibleBienvenida &&
    cliente.company.bienvenidaActiva &&
    cliente.company.bienvenidaValor != null
      ? {
          tipo: cliente.company.bienvenidaTipo,
          valor: Number(cliente.company.bienvenidaValor),
        }
      : null
  const pendingPayment =
    membership && PENDIENTE_PAGO_ESTADOS.includes(membership.estado) ? membership : null
  const pendingChange = isActive && membership?.planIdSolicitado ? membership : null

  return (
    <main className="container max-w-5xl py-8">
      {/* ── Hero VIP ──────────────────────────────────────────────────────── */}
      <header className="animate-slide-up relative mb-8 overflow-hidden rounded-3xl bg-[oklch(0.15_0.04_260)] p-7 text-white shadow-premium sm:p-10">
        {/* Halos de marca */}
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-info/20 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">
              Membresías · {cliente.company.name}
            </p>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="shrink-0 -mt-1 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Link href="/mis-membresias">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Mis membresías
              </Link>
            </Button>
          </div>

          <div className="max-w-xl">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Elige tu plan y empieza a ahorrar
            </h1>
            <p className="mt-2 text-white/70">
              Beneficios exclusivos de miembro, validados con tu código QR en cada visita.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Activación con QR', 'Cambia cuando quieras', 'Ahorro en cada visita'].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-inset ring-white/15"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Banners de estado ─────────────────────────────────────────────── */}
      <div className="mb-8 space-y-3">
        {pendingPayment && (
          <div className="flex flex-col gap-3 rounded-2xl border border-warning/25 bg-warning/8 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15">
                <Clock className="h-4.5 w-4.5 text-warning-foreground" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  Plan {pendingPayment.plan.nombre} pendiente de pago
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {pendingPayment.estado === 'RECHAZADA'
                    ? 'Tu comprobante fue rechazado. Envía uno nuevo para activarlo.'
                    : 'Sube tu comprobante para que el equipo active tu membresía.'}
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="shrink-0 bg-warning-foreground hover:bg-warning-foreground/90">
              <Link href={`/membresia/${pendingPayment.id}`}>
                <CreditCard className="mr-2 h-4 w-4" /> Completar pago
              </Link>
            </Button>
          </div>
        )}

        {pendingChange && (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <ArrowRightLeft className="h-4.5 w-4.5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  Cambio a {pendingChange.planSolicitado?.nombre} solicitado
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Tu plan actual sigue activo. Sube el comprobante del nuevo plan para completar el cambio.
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link href={`/membresia/${pendingChange.id}`}>
                <CreditCard className="mr-2 h-4 w-4" /> Subir comprobante
              </Link>
            </Button>
          </div>
        )}

        {isActive && !pendingChange && (
          <div className="flex flex-col gap-3 rounded-2xl border border-success/20 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/12">
                <CheckCircle2 className="h-4.5 w-4.5 text-success" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  Tu plan {membership?.plan.nombre} está activo
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Puedes cambiar a otro plan cuando quieras; el actual sigue vigente hasta que se apruebe el cambio.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/mis-membresias">Ver mi membresía</Link>
            </Button>
          </div>
        )}
      </div>

      {/* ── Grid de planes ────────────────────────────────────────────────── */}
      {planes.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-10 text-center shadow-card">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto flex max-w-md flex-col items-center gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Sin planes disponibles
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Esta empresa aún no tiene planes publicados. Vuelve pronto.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/mis-membresias">Volver a mis membresías</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <PlanesGrid
            planes={planes}
            currentPlanId={isActive ? membership!.planId : null}
            requestedPlanId={membership?.planIdSolicitado ?? null}
            hasActive={!!isActive}
            activeMembershipId={membership?.id ?? null}
            currentPlanPrecio={isActive ? Number(membership!.plan.precio) : null}
            prefs={cliente.company}
            bienvenida={bienvenida}
          />

          {/* Confianza: reduce la fricción de compra sin agregar ruido. */}
          <div className="animate-fade-up delay-500 mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Pago verificado por el equipo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Tu QR se activa al aprobarse el pago
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Cambia de plan cuando quieras
            </span>
          </div>
        </>
      )}
    </main>
  )
}
