import { Badge } from '@/components/ui/badge'
import type { MembershipEstado } from '@/types'

// Estados sobre tokens semánticos del design system (soportan dark mode).
const MAP: Record<MembershipEstado, { label: string; className: string }> = {
  ACTIVA:          { label: 'Activa',        className: 'bg-success/10 text-success' },
  PENDIENTE:       { label: 'Pendiente',     className: 'bg-warning/15 text-warning-foreground' },
  PENDIENTE_PAGO:  { label: 'Pago enviado',  className: 'bg-info/10 text-info' },
  RECHAZADA:       { label: 'Pago rechazado', className: 'bg-destructive/10 text-destructive' },
  VENCIDA:         { label: 'Vencida',       className: 'bg-warning/15 text-warning-foreground' },
  CANCELADA:       { label: 'Cancelada',     className: 'bg-muted text-muted-foreground' },
}

export function EstadoBadge({ estado }: { estado: MembershipEstado }) {
  const cfg = MAP[estado] ?? { label: estado, className: 'bg-muted text-muted-foreground' }
  return (
    <Badge variant="secondary" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}
