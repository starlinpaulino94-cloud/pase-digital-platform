import Link from 'next/link'
import Image from 'next/image'
import { differenceInDays } from 'date-fns'
import { QrCode, ChevronRight, Infinity as InfinityIcon, Clock } from 'lucide-react'

interface MembershipCardProps {
  membership: {
    id: string
    companyId: string
    company: {
      id: string
      name: string
      logoUrl: string | null
      type: string
    }
    plan: {
      id: string
      nombre: string
      precio: number
      esIlimitado: boolean
    }
    estado: string
    fechaVencimiento: Date | string | null
    fechaInicio: Date | string | null
    lavadosRestantes: number
    qrToken: { id: string; token: string } | null
  }
}

const ESTADO_LABEL: Record<string, string> = {
  ACTIVA: 'Activa',
  PENDIENTE: 'Pendiente',
  PENDIENTE_PAGO: 'Esperando pago',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
  RECHAZADA: 'Rechazada',
}

/**
 * Membresía como tarjeta bancaria digital (estilo wallet): gradiente de marca
 * cuando está activa, versión apagada cuando no, chip de estado en glass y
 * el QR como acción principal. Toda la tarjeta es un solo enlace.
 */
export function MembershipCard({ membership }: MembershipCardProps) {
  const now = new Date()
  const vencimiento = membership.fechaVencimiento
    ? new Date(membership.fechaVencimiento)
    : null
  const isActive =
    membership.estado === 'ACTIVA' && (!vencimiento || vencimiento > now)
  const isExpired =
    membership.estado === 'VENCIDA' || (vencimiento !== null && vencimiento <= now)

  let expiryText = ''
  let porVencer = false
  if (vencimiento) {
    const daysLeft = differenceInDays(vencimiento, now)
    if (daysLeft > 0) {
      expiryText = `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`
      porVencer = daysLeft <= 7
    } else if (daysLeft < 0) {
      expiryText = `Venció hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? 's' : ''}`
    } else {
      expiryText = 'Vence hoy'
      porVencer = true
    }
  }

  const estadoLabel = ESTADO_LABEL[membership.estado] ?? membership.estado

  return (
    <Link href={`/membresia/${membership.id}`} className="group block">
      <div
        className={`card-interactive relative overflow-hidden rounded-3xl p-5 text-white ${
          isActive
            ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 ring-1 ring-white/15'
            : isExpired
              ? 'bg-gradient-to-br from-slate-500 to-slate-700 ring-1 ring-white/10'
              : 'bg-gradient-to-br from-slate-600 to-slate-800 ring-1 ring-white/10'
        }`}
      >
        {/* Textura + brillo que cruza al hover */}
        <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-30" />
        <div className="pointer-events-none absolute -inset-x-full inset-y-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[200%]" />
        {isActive && (
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-sky-400/25 blur-2xl" />
        )}

        <div className="relative">
          {/* Cabecera: empresa + estado */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {membership.company.logoUrl ? (
                <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white">
                  <Image
                    src={membership.company.logoUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xs font-bold">
                  {membership.company.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold leading-tight">
                  {membership.company.name}
                </p>
                <p className="truncate text-xs text-white/60">
                  Membresía digital
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur ${
                isActive
                  ? 'border-emerald-300/30 bg-emerald-400/20 text-emerald-100'
                  : isExpired
                    ? 'border-red-300/30 bg-red-400/20 text-red-100'
                    : 'border-amber-300/30 bg-amber-400/20 text-amber-100'
              }`}
            >
              {estadoLabel}
            </span>
          </div>

          {/* Plan (nivel de la tarjeta) */}
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Plan</p>
            <p className="mt-0.5 text-xl font-bold tracking-tight">
              {membership.plan.nombre}
            </p>
          </div>

          {/* Pie: vencimiento + usos + acción */}
          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0 space-y-1 text-xs">
              {expiryText ? (
                <p
                  className={`inline-flex items-center gap-1.5 ${
                    isExpired
                      ? 'text-red-200'
                      : porVencer
                        ? 'font-medium text-amber-200'
                        : 'text-white/70'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> {expiryText}
                </p>
              ) : (
                <p className="text-white/60">Sin fecha de vencimiento</p>
              )}
              {isActive &&
                (membership.plan.esIlimitado ? (
                  <p className="inline-flex items-center gap-1.5 font-medium text-sky-200">
                    <InfinityIcon className="h-3.5 w-3.5" /> Usos ilimitados
                  </p>
                ) : (
                  <p className="font-medium text-white/85">
                    {membership.lavadosRestantes} uso
                    {membership.lavadosRestantes !== 1 ? 's' : ''} restante
                    {membership.lavadosRestantes !== 1 ? 's' : ''}
                  </p>
                ))}
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                isActive && membership.qrToken
                  ? 'bg-white text-blue-700 group-hover:bg-sky-50'
                  : 'border border-white/25 bg-white/10 text-white group-hover:bg-white/20'
              }`}
            >
              {isActive && membership.qrToken ? (
                <>
                  <QrCode className="h-4 w-4" /> Mi QR
                </>
              ) : (
                <>
                  Detalles <ChevronRight className="h-4 w-4" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
