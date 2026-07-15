import { Badge } from '@/components/ui/badge'
import type { MembershipEstado } from '@/types'
import { membresiaEstadoUi } from '@/lib/estados'

/** Badge de estado de membresía. Fuente única: `lib/estados.ts`. */
export function EstadoBadge({ estado }: { estado: MembershipEstado }) {
  const { label, variant } = membresiaEstadoUi(estado)
  return <Badge variant={variant}>{label}</Badge>
}
