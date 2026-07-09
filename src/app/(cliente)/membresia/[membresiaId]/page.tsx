import { notFound, redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Check,
  Gift,
  Clock,
  Infinity as InfinityIcon,
  History,
  ShieldCheck,
} from 'lucide-react'
import { QRDisplay } from '@/components/qr/QRDisplay'
import { ComprobanteForm } from '@/components/membresia/ComprobanteForm'
import { formatMoney } from '@/lib/format'

export const metadata = {
  title: 'Detalles de Membresía',
}

const ESTADO_LABEL: Record<string, string> = {
  ACTIVA: 'Activa',
  PENDIENTE: 'Pendiente',
  PENDIENTE_PAGO: 'Esperando pago',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
  RECHAZADA: 'Rechazada',
}

export default async function MembershipDetail({ params }: { params: Promise<{ membresiaId: string }> }) {
  const { membresiaId } = await params
  const user = await getUser()
  if (!user || user.metadata.role !== 'CLIENTE') {
    redirect('/login')
  }

  let membership = null
  try {
    membership = await prisma.membership.findUnique({
      where: { id: membresiaId },
      include: {
        cliente: {
          include: { company: true },
        },
        plan: true,
        planSolicitado: true,
      },
    })
  } catch (error) {
    console.error('[membresia-detail] Error loading membership:', error)
    notFound()
  }

  if (!membership) {
    notFound()
  }

  // Verify ownership: por supabaseId o, como respaldo, por el clienteId de la
  // sesión (consistente con getClienteAllMemberships).
  const esPropietario =
    membership.cliente.supabaseId === user.supabaseId ||
    membership.cliente.id === user.metadata.clienteId
  if (!esPropietario) {
    notFound()
  }

  const now = new Date()
  const isActive = membership.estado === 'ACTIVA' && (!membership.fechaVencimiento || membership.fechaVencimiento > now)

  // Load visits for this membership
  const visits = await prisma.visit.findMany({
    where: { membershipId: membresiaId },
    include: { vehiculo: true },
    orderBy: { fechaVisita: 'desc' },
    take: 20,
  })

  // Load active QR
  const qrToken = await prisma.qrToken.findFirst({
    where: { membresiaId: membresiaId, activo: true },
    orderBy: { createdAt: 'desc' },
  })

  // ¿Necesita pago? Membresía pendiente/rechazada, o activa con cambio de plan
  // solicitado (que requiere comprobante del nuevo plan).
  const needsInitialPayment = ['PENDIENTE', 'RECHAZADA'].includes(membership.estado)
  const isChangePending = isActive && membership.planIdSolicitado != null
  const needsPayment = needsInitialPayment || isChangePending
  const planAPagar = isChangePending ? membership.planSolicitado : membership.plan

  // O-13: descuento de bienvenida — solo en el primer pago (membresía nunca
  // activada), nunca en cambios de plan.
  const descuentoBienvenida =
    !isChangePending && membership.fechaInicio == null
      ? Number(membership.descuentoBienvenida ?? 0)
      : 0
  const montoAPagar = Math.max(0, Number(planAPagar?.precio ?? 0) - descuentoBienvenida)

  const metodosPago = needsPayment
    ? await prisma.metodoPago.findMany({
        where: { companyId: membership.cliente.companyId, activo: true },
        orderBy: { createdAt: 'asc' },
      })
    : []

  const estadoLabel = ESTADO_LABEL[membership.estado] ?? membership.estado
  const company = membership.cliente.company

  return (
    <main className="container max-w-2xl py-8">
      <Link
        href="/mis-membresias"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Mis membresías
      </Link>

      {/* Tarjeta digital (héroe) */}
      <div
        className={`relative mb-8 animate-slide-up overflow-hidden rounded-3xl p-6 text-white sm:p-7 ${
          isActive
            ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 ring-1 ring-white/15'
            : 'bg-gradient-to-br from-slate-600 to-slate-800 ring-1 ring-white/10'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-30" />
        {isActive && (
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-sky-400/25 blur-2xl" />
        )}

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {company.logoUrl ? (
                <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white">
                  <Image src={company.logoUrl} alt="" fill className="object-cover" />
                </span>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-bold">
                  {company.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                  {company.name}
                </h1>
                <p className="text-sm text-white/70">{membership.plan.nombre}</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur ${
                isActive
                  ? 'border-emerald-300/30 bg-emerald-400/20 text-emerald-100'
                  : membership.estado === 'VENCIDA'
                    ? 'border-red-300/30 bg-red-400/20 text-red-100'
                    : 'border-amber-300/30 bg-amber-400/20 text-amber-100'
              }`}
            >
              {estadoLabel}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/75">
            {membership.fechaVencimiento && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {isActive ? 'Vence' : 'Venció'} el{' '}
                {format(membership.fechaVencimiento, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            )}
            {isActive &&
              (membership.plan.esIlimitado ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-sky-200">
                  <InfinityIcon className="h-4 w-4" /> Usos ilimitados
                </span>
              ) : (
                <span className="font-medium text-white/90">
                  {membership.lavadosRestantes} uso
                  {membership.lavadosRestantes !== 1 ? 's' : ''} restante
                  {membership.lavadosRestantes !== 1 ? 's' : ''}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Sección de pago (pendiente o cambio de plan) */}
      {needsPayment && (
        <div className="mb-8 space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <div>
            <h2 className="text-h3 text-foreground">
              {isChangePending ? 'Pago del cambio de plan' : 'Completar pago'}
            </h2>
            <p className="mt-1 text-small text-muted-foreground">
              {isChangePending
                ? `Cambio al plan ${planAPagar?.nombre}. Sube el comprobante para que el equipo lo apruebe; tu plan actual sigue activo mientras tanto.`
                : 'Realiza el pago con uno de los métodos y sube tu comprobante para activar tu membresía.'}
            </p>
          </div>

          <div className="rounded-xl bg-muted/60 p-4">
            {descuentoBienvenida > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Plan {planAPagar?.nombre}</span>
                  <span>{formatMoney(Number(planAPagar?.precio ?? 0), company)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-success">
                  <span className="inline-flex items-center gap-1.5">
                    <Gift className="h-4 w-4" /> Descuento de bienvenida
                  </span>
                  <span>−{formatMoney(descuentoBienvenida, company)}</span>
                </div>
                <div className="my-2 border-t border-border/60" />
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monto a pagar</span>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {formatMoney(montoAPagar, company)}
              </span>
            </div>
          </div>

          {membership.estado === 'RECHAZADA' && membership.rechazadoReason && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <strong>Motivo del rechazo:</strong> {membership.rechazadoReason}
            </div>
          )}

          {metodosPago.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Datos para el pago</h3>
              {metodosPago.map((m) => (
                <div key={m.id} className="rounded-xl border border-border/60 p-3 text-sm">
                  <p className="font-medium text-foreground">{m.nombre}</p>
                  {m.titular && (
                    <p className="text-muted-foreground">Titular: {m.titular}</p>
                  )}
                  {m.numeroCuenta && (
                    <p className="text-muted-foreground">
                      Cuenta: {m.numeroCuenta}
                      {m.tipoCuenta ? ` (${m.tipoCuenta})` : ''}
                    </p>
                  )}
                  {m.instrucciones && (
                    <p className="mt-1 text-xs text-muted-foreground">{m.instrucciones}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <ComprobanteForm
            membershipId={membership.id}
            metodosPago={metodosPago.map((m) => ({ id: m.id, nombre: m.nombre }))}
          />
        </div>
      )}

      {/* QR protagonista */}
      {qrToken ? (
        <div className="mb-8 flex flex-col items-center rounded-2xl border border-border/60 bg-card px-6 py-8 text-center shadow-card">
          <h2 className="text-h2 text-foreground">Tu código QR</h2>
          <p className="mt-1 max-w-sm text-small text-muted-foreground">
            Muéstralo en {company.name} para validar tu membresía al instante.
          </p>
          <div className="mt-6">
            <QRDisplay token={qrToken.token} />
          </div>
          <p className="mt-5 inline-flex items-center gap-1.5 text-caption">
            <ShieldCheck className="h-3.5 w-3.5" />
            Por seguridad, el código se renueva cada vez que usas tu membresía.
          </p>
        </div>
      ) : isActive ? (
        <div className="mb-8 rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
          Tu código QR se está generando. Vuelve a cargar la página en un momento.
        </div>
      ) : null}

      {/* Beneficios */}
      {membership.plan.beneficios && membership.plan.beneficios.length > 0 && (
        <div className="mb-8 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <h2 className="text-h3 mb-4 text-foreground">Beneficios del plan</h2>
          <ul className="space-y-2.5">
            {membership.plan.beneficios.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-body text-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-3 w-3 text-success" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detalles */}
      <div className="mb-8 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <h2 className="text-h3 mb-4 text-foreground">Detalles de la membresía</h2>
        <div className="space-y-3">
          {membership.fechaInicio && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha de inicio</span>
              <span className="text-foreground">
                {format(membership.fechaInicio, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
          )}
          {membership.fechaVencimiento && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha de vencimiento</span>
              <span className="text-foreground">
                {format(membership.fechaVencimiento, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
          )}
          {!membership.plan.esIlimitado && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usos restantes</span>
              <span className="font-semibold text-foreground">{membership.lavadosRestantes}</span>
            </div>
          )}
          {membership.plan.esIlimitado && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipo</span>
              <span className="text-foreground">Ilimitado</span>
            </div>
          )}
        </div>
      </div>

      {/* Historial de visitas */}
      {visits.length > 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <h2 className="text-h3 mb-4 flex items-center gap-2 text-foreground">
            <History className="h-4 w-4 text-muted-foreground" /> Historial de visitas
          </h2>
          <div className="space-y-3">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between border-b border-border/50 pb-3 text-sm last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-foreground">{visit.servicio}</p>
                  {visit.vehiculo && (
                    <p className="text-xs text-muted-foreground">
                      {visit.vehiculo.marca} {visit.vehiculo.modelo}
                    </p>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {format(visit.fechaVisita, 'd/M/yyyy HH:mm', { locale: es })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Cuando uses tu membresía, tus visitas aparecerán aquí.
        </div>
      )}
    </main>
  )
}
