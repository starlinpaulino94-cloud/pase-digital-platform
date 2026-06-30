import { Badge } from '@/components/ui/badge'
import type { MembershipEstado } from '@/types'

const MAP: Record<MembershipEstado, { label: string; className: string }> = {
  ACTIVA:          { label: 'Activa',             className: 'bg-green-100 text-green-700' },
  PENDIENTE:       { label: 'Pendiente',           className: 'bg-yellow-100 text-yellow-700' },
  PENDIENTE_PAGO:  { label: 'Pago enviado',        className: 'bg-blue-100 text-blue-700' },
  RECHAZADA:       { label: 'Pago rechazado',      className: 'bg-red-100 text-red-700' },
  VENCIDA:         { label: 'Vencida',             className: 'bg-orange-100 text-orange-700' },
  CANCELADA:       { label: 'Cancelada',           className: 'bg-slate-200 text-slate-600' },
}

export function EstadoBadge({ estado }: { estado: MembershipEstado }) {
  const cfg = MAP[estado] ?? { label: estado, className: 'bg-slate-100 text-slate-600' }
  return (
    <Badge variant="secondary" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}
