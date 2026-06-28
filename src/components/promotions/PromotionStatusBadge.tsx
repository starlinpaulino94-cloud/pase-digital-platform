import { Badge } from '@/components/ui/badge'
import type { PromotionStatus } from '@/modules/promociones/types'

const CONFIG: Record<PromotionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT:     { label: 'Borrador',   variant: 'outline' },
  ACTIVE:    { label: 'Publicada',  variant: 'default' },
  PAUSED:    { label: 'Pausada',    variant: 'secondary' },
  EXPIRED:   { label: 'Expirada',   variant: 'destructive' },
  CANCELLED: { label: 'Archivada',  variant: 'outline' },
}

export function PromotionStatusBadge({ status }: { status: PromotionStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: 'outline' }
  return <Badge variant={variant}>{label}</Badge>
}
