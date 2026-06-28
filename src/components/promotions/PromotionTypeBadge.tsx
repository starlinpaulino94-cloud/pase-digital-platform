import { Badge } from '@/components/ui/badge'
import type { PromotionType } from '@/modules/promociones/types'

const LABELS: Record<PromotionType, string> = {
  COUPON:          'Cupón',
  DISCOUNT:        'Descuento',
  PLAN:            'Plan',
  MEMBERSHIP:      'Membresía',
  VISIT_BASED:     'Por Visitas',
  TEMPORARY_OFFER: 'Oferta Temporal',
  BUNDLE:          'Bundle',
  CASHBACK:        'Cashback',
  REFERRAL:        'Referido',
}

export function PromotionTypeBadge({ type }: { type: PromotionType }) {
  return <Badge variant="secondary">{LABELS[type] ?? type}</Badge>
}
