import { Badge } from '@/components/ui/badge'
import type { ValidationStatus } from '@/modules/validacion-qr/types'

const CONFIG: Record<ValidationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  SCANNED:   { label: 'Escaneado',   variant: 'outline' },
  EVALUATED: { label: 'Evaluado',    variant: 'secondary' },
  CONFIRMED: { label: 'Confirmado',  variant: 'default' },
  REJECTED:  { label: 'Rechazado',   variant: 'destructive' },
  EXPIRED:   { label: 'Expirado',    variant: 'outline' },
  CANCELLED: { label: 'Cancelado',   variant: 'outline' },
}

export function ValidationStatusBadge({ status }: { status: ValidationStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: 'outline' }
  return <Badge variant={variant}>{label}</Badge>
}
