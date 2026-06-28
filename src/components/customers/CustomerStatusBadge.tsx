import { Badge } from '@/components/ui/badge'
import type { CustomerStatus } from '@/modules/clientes/types'

const CONFIG: Record<CustomerStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ACTIVE:   { label: 'Activo',    variant: 'default' },
  INACTIVE: { label: 'Inactivo',  variant: 'outline' },
  BLOCKED:  { label: 'Bloqueado', variant: 'destructive' },
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: 'outline' }
  return <Badge variant={variant}>{label}</Badge>
}
