import Link from 'next/link'
import { CheckCircle2, Clock, ArrowRightLeft, CreditCard } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlanesGrid, type PlanItem } from '@/components/cliente/PlanesGrid'

export const dynamic = 'force-dynamic'

const PENDIENTE_PAGO_ESTADOS = ['PENDIENTE', 'PENDIENTE_PAGO', 'RECHAZADA']

export default async function PlanesPage() {
  const user = await requireRole('CLIENTE')

  if (!user.metadata.clienteId) {
    return <p className="text-muted-foreground">Tu cuenta no está completamente configurada.</p>
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
    return <p className="text-muted-foreground">No pudimos cargar tu información. Intenta más tarde.</p>
  }

  if (!cliente) return <p className="text-muted-foreground">No se encontró tu información.</p>

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
  // O-13: el beneficio de bienvenida aplica solo si el cliente nunca activó
  // una membresía en esta empresa (fechaInicio null = jamás activada).
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planes disponibles</h1>
        <p className="mt-1 text-muted-foreground">
          Elige o cambia el plan que mejor se adapte a ti en {cliente.company.name}
        </p>
      </div>

      {/* Banner: pago pendiente */}
      {pendingPayment && (
        <Card className="border-warning/30 bg-warning/15">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-warning-foreground" />
              <div>
                <p className="font-medium text-warning-foreground">
                  Tienes el plan {pendingPayment.plan.nombre} pendiente de pago
                </p>
                <p className="text-sm text-warning-foreground">
                  {pendingPayment.estado === 'RECHAZADA'
                    ? 'Tu comprobante fue rechazado. Envía uno nuevo para activarlo.'
                    : 'Sube tu comprobante para que el equipo active tu membresía.'}
                </p>
              </div>
            </div>
            <Button asChild className="bg-warning hover:bg-warning">
              <Link href={`/membresia/${pendingPayment.id}`}>
                <CreditCard className="mr-2 h-4 w-4" /> Completar pago
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Banner: cambio de plan solicitado */}
      {pendingChange && (
        <Card className="border-info/30 bg-info/10">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ArrowRightLeft className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-info">
                  Cambio a {pendingChange.planSolicitado?.nombre} solicitado
                </p>
                <p className="text-sm text-info">
                  Tu plan actual sigue activo. Sube el comprobante del nuevo plan para
                  que el equipo lo apruebe.
                </p>
              </div>
            </div>
            <Button asChild className="bg-primary hover:bg-info/100">
              <Link href={`/membresia/${pendingChange.id}`}>
                <CreditCard className="mr-2 h-4 w-4" /> Subir comprobante
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Banner: membresía activa sin cambios */}
      {isActive && !pendingChange && (
        <Card className="border-success/25 bg-success/10">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-success">
                  Tu plan {membership?.plan.nombre} está activo
                </p>
                <p className="text-sm text-success">
                  Puedes cambiar a otro plan cuando quieras; el actual sigue vigente
                  hasta que se apruebe el cambio.
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/mis-membresias">Ver mi membresía</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grid de planes */}
      {planes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay planes disponibles en este momento.
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  )
}
