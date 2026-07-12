/** Fase E5 · Presentación de los estados de compra (compartida cliente/admin). */

export const COMPRA_ESTADO_UI: Record<
  string,
  { label: string; badge: 'success' | 'warning' | 'destructive' | 'secondary' | 'info' }
> = {
  SOLICITADA: { label: 'Solicitada', badge: 'secondary' },
  PENDIENTE_PAGO: { label: 'Pendiente de pago', badge: 'warning' },
  EN_VALIDACION: { label: 'En validación', badge: 'info' },
  APROBADA: { label: 'Aprobada', badge: 'info' },
  ACTIVA: { label: 'Activa', badge: 'success' },
  RECHAZADA: { label: 'Pago rechazado', badge: 'destructive' },
  CONSUMIDA: { label: 'Consumida', badge: 'secondary' },
  EXPIRADA: { label: 'Expirada', badge: 'warning' },
  CANCELADA: { label: 'Cancelada', badge: 'secondary' },
}

export function compraEstadoUi(estado: string) {
  return COMPRA_ESTADO_UI[estado] ?? { label: estado, badge: 'secondary' as const }
}
