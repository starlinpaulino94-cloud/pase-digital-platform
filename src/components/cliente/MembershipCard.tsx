'use client'

import Link from 'next/link'
import Image from 'next/image'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
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
      precio: any
    }
    estado: string
    fechaVencimiento: Date | null
    fechaInicio: Date | null
  }
}

export function MembershipCard({ membership }: MembershipCardProps) {
  const now = new Date()
  const isActive = membership.estado === 'ACTIVA' && (!membership.fechaVencimiento || membership.fechaVencimiento > now)
  const isExpired = membership.estado === 'VENCIDA' || (membership.fechaVencimiento && membership.fechaVencimiento <= now)

  let expiryText = ''
  if (membership.fechaVencimiento) {
    const daysLeft = differenceInDays(membership.fechaVencimiento, now)
    if (daysLeft > 0) {
      expiryText = `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`
    } else if (daysLeft < 0) {
      expiryText = `Vencida hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? 's' : ''}`
    } else {
      expiryText = 'Vence hoy'
    }
  }

  const estadoVariant = isActive ? 'default' : isExpired ? 'destructive' : 'secondary'
  const estadoLabel = membership.estado === 'PENDIENTE_PAGO' ? 'Esperando Pago' : membership.estado

  return (
    <div className="border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow">
      {/* Header con logo y empresa */}
      <div className="flex gap-3 items-start">
        {membership.company.logoUrl ? (
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
            <Image
              src={membership.company.logoUrl}
              alt={membership.company.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-12 w-12 flex-shrink-0 rounded bg-muted flex items-center justify-center text-xs font-semibold">
            {membership.company.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{membership.company.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{membership.plan.nombre}</p>
        </div>
      </div>

      {/* Estado y vencimiento */}
      <div className="flex items-center justify-between">
        <Badge variant={estadoVariant}>{estadoLabel}</Badge>
        {expiryText && (
          <span className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
            {expiryText}
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-2">
        <Link href={`/membresia/${membership.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Ver Detalles
          </Button>
        </Link>
        <Link href={`/membresia/${membership.id}/qr`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            QR
          </Button>
        </Link>
      </div>
    </div>
  )
}
