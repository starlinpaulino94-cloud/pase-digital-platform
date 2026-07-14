import { notFound, redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { membresiaEstadoUi } from '@/lib/estados'
import { differenceInCalendarDays } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Check,
  Gift,
  Clock,
  Infinity as InfinityIcon,
  History,
  Share2,
  Shield,
  Calendar,
  Gauge,
} from 'lucide-react'
import { QRShareCard } from '@/components/qr/QRShareCard'
import { ComprobanteForm } from '@/components/membresia/ComprobanteForm'
import { formatMoney } from '@/lib/format'

export const metadata = {
  title: 'Detalles de Membresía',
}

const TZ = 'America/Santo_Domingo'
const fmtFechaLarga = (d: Date) =>
  new Intl.DateTimeFormat('es-DO', { timeZone: TZ, dateStyle: 'long' }).format(d)
const fmtFechaHora = (d: Date) =>
  new Intl.DateTimeFormat('es-DO', {
    timeZone: TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
const fmtFechaHoraCorta = (d: Date) =>
  new Intl.DateTimeFormat('es-DO', {
    timeZone: TZ,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)

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

  const esPropietario =
    membership.cliente.supabaseId === user.supabaseId ||
    membership.cliente.id === user.metadata.clienteId
  if (!esPropietario) {
    notFound()
  }

  const now = new Date()
  const isActive = membership.estado === 'ACTIVA' && (!membership.fechaVencimiento || membership.fechaVencimiento > now)

  const visits = await prisma.visit.findMany({
    where: { membershipId: membresiaId },
    include: { vehiculo: true },
    orderBy: { fechaVisita: 'desc' },
    take: 20,
  })

  const qrToken = await prisma.qrToken.findFirst({
    where: { membresiaId: membresiaId, activo: true },
    orderBy: { createdAt: 'desc' },
  })

  const enviosQr = await prisma.auditLog.findMany({
    where: {
      accion: 'QR_COMPARTIDO',
      payload: { path: ['membresiaId'], equals: membresiaId },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, createdAt: true },
  }).catch(() => [])

  const diasRestantes = membership.fechaVencimiento
    ? differenceInCalendarDays(membership.fechaVencimiento, now)
    : null

  const needsInitialPayment = ['PENDIENTE', 'RECHAZADA'].includes(membership.estado)
  const isChangePending = isActive && membership.planIdSolicitado != null
  const needsPayment = needsInitialPayment || isChangePending
  const planAPagar = isChangePending ? membership.planSolicitado : membership.plan

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

  const estadoLabel = membresiaEstadoUi(membership.estado).label
  const company = membership.cliente.company

  return (
    <main className="container max-w-2xl py-8">
      <Link
        href="/mis-membresias"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Mis membresías
      </Link>

      {/* Hero card */}
      <div
        className={`relative mb-8 overflow-hidden rounded-2xl p-6 text-white sm:p-8 ${
          isActive
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ring-1 ring-white/10'
            : 'bg-gradient-to-br from-slate-500 to-slate-600 ring-1 ring-white/10'
        }`}
      >
        {isActive && (
          <>
            <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-indigo-500/15 blur-3xl" />
          </>
        )}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {company.logoUrl ? (
                <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white shadow-lg">
                  <Image src={company.logoUrl} alt="" fill className="object-cover" />
                </span>
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-bold backdrop-blur">
                  {company.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                  {company.name}
                </h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/60">
                  <Shield className="h-3.5 w-3.5" />
                  {membership.plan.nombre}
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30'
                  : membership.estado === 'VENCIDA'
                    ? 'bg-red-500/20 text-red-300 ring-1 ring-red-400/30'
                    : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30'
              }`}
            >
              {estadoLabel}
            </span>
          </div>

          <div className="mt-6 border-t border-white/[0.08] pt-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
              {membership.fechaVencimiento && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {isActive ? 'Vence' : 'Venció'} el{' '}
                  {fmtFechaLarga(membership.fechaVencimiento)}
                </span>
              )}
              {isActive &&
                (membership.plan.esIlimitado ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-blue-300">
                    <InfinityIcon className="h-4 w-4" /> Usos ilimitados
                  </span>
                ) : (
                  <span className="font-medium text-white/80">
                    {membership.lavadosRestantes} uso
                    {membership.lavadosRestantes !== 1 ? 's' : ''} restante
                    {membership.lavadosRestantes !== 1 ? 's' : ''}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Sección de pago */}
        {needsPayment && (
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                {isChangePending ? 'Pago del cambio de plan' : 'Completar pago'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isChangePending
                  ? `Cambio al plan ${planAPagar?.nombre}. Sube el comprobante para que el equipo lo apruebe; tu plan actual sigue activo mientras tanto.`
                  : 'Realiza el pago con uno de los métodos y sube tu comprobante para activar tu membresía.'}
              </p>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              {descuentoBienvenida > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Plan {planAPagar?.nombre}</span>
                    <span>{formatMoney(Number(planAPagar?.precio ?? 0), company)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Gift className="h-4 w-4" /> Descuento de bienvenida
                    </span>
                    <span>-{formatMoney(descuentoBienvenida, company)}</span>
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
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                <strong>Motivo del rechazo:</strong> {membership.rechazadoReason}
              </div>
            )}

            {metodosPago.length > 0 && (
              <div className="mt-5 space-y-2">
                <h3 className="text-sm font-medium text-foreground">Datos para el pago</h3>
                {metodosPago.map((m) => (
                  <div key={m.id} className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
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

            <div className="mt-5">
              <ComprobanteForm
                membershipId={membership.id}
                metodosPago={metodosPago.map((m) => ({ id: m.id, nombre: m.nombre }))}
              />
            </div>
          </section>
        )}

        {/* QR */}
        {qrToken && isActive ? (
          <QRShareCard
            qrTokenId={qrToken.id}
            token={qrToken.token}
            companyName={company.name}
            diasRestantes={diasRestantes}
            esIlimitado={membership.plan.esIlimitado ?? false}
            lavadosRestantes={membership.lavadosRestantes ?? 0}
            compartidoCount={qrToken.compartidoCount}
            ultimoCompartidoISO={qrToken.ultimoCompartido?.toISOString() ?? null}
          />
        ) : !qrToken && isActive && !membership.plan.esIlimitado && (membership.lavadosRestantes ?? 0) <= 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            Sin usos disponibles en este período. Renueva tu membresía para seguir
            usando tus beneficios.
          </div>
        ) : !qrToken && isActive ? (
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            Tu código para canjear se está generando. Vuelve a cargar la página en un
            momento.
          </div>
        ) : null}

        {/* Envíos QR */}
        {enviosQr.length > 0 && (
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15">
                <Share2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              Envíos de tu QR
            </h2>
            <div className="space-y-0 divide-y divide-border/50">
              {enviosQr.map((envio) => (
                <div
                  key={envio.id}
                  className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
                >
                  <span className="inline-flex items-center gap-1.5 text-foreground">
                    <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> QR compartido
                  </span>
                  <span className="text-muted-foreground">
                    {fmtFechaHora(envio.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Beneficios */}
        {membership.plan.beneficios && membership.plan.beneficios.length > 0 && (
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15">
                <Gift className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Beneficios del plan
            </h2>
            <ul className="space-y-3">
              {membership.plan.beneficios.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/15">
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Detalles */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500/10 dark:bg-slate-500/15">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            Detalles de la membresía
          </h2>
          <div className="space-y-0 divide-y divide-border/50">
            {membership.fechaInicio && (
              <div className="flex justify-between py-3 text-sm first:pt-0">
                <span className="text-muted-foreground">Fecha de inicio</span>
                <span className="font-medium text-foreground">
                  {fmtFechaLarga(membership.fechaInicio)}
                </span>
              </div>
            )}
            {membership.fechaVencimiento && (
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Fecha de vencimiento</span>
                <span className="font-medium text-foreground">
                  {fmtFechaLarga(membership.fechaVencimiento)}
                </span>
              </div>
            )}
            {!membership.plan.esIlimitado && (
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">Usos restantes</span>
                <span className="font-semibold text-foreground">{membership.lavadosRestantes}</span>
              </div>
            )}
            {membership.plan.esIlimitado && (
              <div className="flex items-center justify-between py-3 text-sm last:pb-0">
                <span className="text-muted-foreground">Tipo</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <InfinityIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Ilimitado
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Historial de visitas */}
        {visits.length > 0 ? (
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 dark:bg-violet-500/15">
                <History className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              Historial de visitas
            </h2>
            <div className="space-y-0 divide-y divide-border/50">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
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
                    {fmtFechaHoraCorta(visit.fechaVisita)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            <Gauge className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
            Cuando uses tu membresía, tus visitas aparecerán aquí.
          </div>
        )}
      </div>
    </main>
  )
}
