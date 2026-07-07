import Link from 'next/link'
import Image from 'next/image'
import { differenceInDays } from 'date-fns'
import { QrCode, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  if (vencimiento) {
    const daysLeft = differenceInDays(vencimiento, now)
    if (daysLeft > 0) {
      expiryText = `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`
    } else if (daysLeft < 0) {
      expiryText = `Vció. hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? 's' : ''}`
    } else {
      expiryText = 'Vence hoy'
    }
  }

  const estadoVariant = isActive ? 'default' : isExpired ? 'destructive' : 'secondary'
  const estadoLabel = ESTADO_LABEL[membership.estado] ?? membership.estado

  return (
    <div className="flex flex-col justify-between rounded-xl border p-4 transition-shadow hover:shadow-md">
      <div className="space-y-4">
        {/* Header con logo y empresa */}
        <div className="flex items-start gap-3">
          {membership.company.logoUrl ? (
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={membership.company.logoUrl}
                alt={membership.company.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
              {membership.company.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{membership.company.name}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {membership.plan.nombre}
            </p>
          </div>
          <Badge variant={estadoVariant}>{estadoLabel}</Badge>
        </div>

        {/* Meta: vencimiento + usos */}
        <div className="flex items-center justify-between text-xs">
          {expiryText ? (
            <span className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>
              {expiryText}
            </span>
          ) : (
            <span className="text-muted-foreground">Sin fecha de vencimiento</span>
          )}
          {isActive && !membership.plan.esIlimitado && (
            <span className="font-medium text-foreground">
              {membership.lavadosRestantes} uso{membership.lavadosRestantes !== 1 ? 's' : ''} restante{membership.lavadosRestantes !== 1 ? 's' : ''}
            </span>
          )}
          {isActive && membership.plan.esIlimitado && (
            <span className="font-medium text-emerald-600">Ilimitado</span>
          )}
        </div>
      </div>

      {/* Acción única: ver membresía + QR */}
      <Button asChild variant={isActive ? 'default' : 'outline'} className="mt-4 w-full">
        <Link href={`/membresia/${membership.id}`}>
          {isActive && membership.qrToken ? (
            <>
              <QrCode className="mr-2 h-4 w-4" />
              Ver membresía y QR
            </>
          ) : (
            <>
              Ver detalles
              <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Link>
      </Button>
    </div>
  )
}
