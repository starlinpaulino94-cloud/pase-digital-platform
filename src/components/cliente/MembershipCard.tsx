import Link from 'next/link'
import Image from 'next/image'
import { differenceInDays } from 'date-fns'
import { QrCode, ChevronRight, Infinity as InfinityIcon, Clock, Shield } from 'lucide-react'
import { membresiaEstadoUi } from '@/lib/estados'

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

  const estadoLabel = membresiaEstadoUi(membership.estado).labelCliente

  return (
    <Link href={`/membresia/${membership.id}`} className="group block">
      <div
        className={`relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5 ${
          isActive
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ring-1 ring-white/10'
            : isExpired
              ? 'bg-gradient-to-br from-slate-400 to-slate-500 ring-1 ring-white/10'
              : 'bg-gradient-to-br from-slate-600 to-slate-700 ring-1 ring-white/10'
        }`}
      >
        {/* Ambient glow */}
        {isActive && (
          <>
            <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
          </>
        )}

        {/* Subtle pattern overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        {/* Shine effect on hover */}
        <div className="pointer-events-none absolute -inset-x-full inset-y-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-700 group-hover:translate-x-[200%]" />

        <div className="relative p-5 sm:p-6">
          {/* Top: Company info + Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {membership.company.logoUrl ? (
                <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white shadow-lg">
                  <Image
                    src={membership.company.logoUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xs font-bold text-white backdrop-blur">
                  {membership.company.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold leading-tight text-white">
                  {membership.company.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/50">
                  <Shield className="h-3 w-3" />
                  Membresía digital
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30'
                  : isExpired
                    ? 'bg-red-500/20 text-red-300 ring-1 ring-red-400/30'
                    : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30'
              }`}
            >
              {estadoLabel}
            </span>
          </div>

          {/* Plan name — large and prominent */}
          <div className="mt-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Plan</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-white">
              {membership.plan.nombre}
            </p>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/[0.08]" />

          {/* Bottom: Expiry + Usage + QR */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              {expiryText ? (
                <p
                  className={`inline-flex items-center gap-1.5 text-xs ${
                    isExpired
                      ? 'text-red-300'
                      : porVencer
                        ? 'font-medium text-amber-300'
                        : 'text-white/60'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> {expiryText}
                </p>
              ) : (
                <p className="text-xs text-white/40">Sin vencimiento</p>
              )}
              {isActive &&
                (membership.plan.esIlimitado ? (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-300">
                    <InfinityIcon className="h-3.5 w-3.5" /> Usos ilimitados
                  </p>
                ) : (
                  <p className="text-xs font-medium text-white/80">
                    {membership.lavadosRestantes} uso
                    {membership.lavadosRestantes !== 1 ? 's' : ''} restante
                    {membership.lavadosRestantes !== 1 ? 's' : ''}
                  </p>
                ))}
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive && membership.qrToken
                  ? 'bg-white text-slate-900 shadow-lg group-hover:shadow-xl group-hover:scale-[1.02]'
                  : 'border border-white/20 bg-white/5 text-white/80 backdrop-blur group-hover:bg-white/10'
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
