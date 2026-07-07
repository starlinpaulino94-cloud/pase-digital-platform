// F4.2: catálogo de tipos y visibilidades de promoción (fuente única para
// formularios, validación en actions y etiquetas en tarjetas).

export const PROMO_TIPOS = [
  { value: 'descuento', label: 'Descuento %' },
  { value: 'monto_fijo', label: 'Monto fijo de descuento' },
  { value: '2x1', label: '2x1' },
  { value: '3x2', label: '3x2' },
  { value: 'happy_hour', label: 'Happy Hour' },
  { value: 'upgrade', label: 'Upgrade de servicio' },
  { value: 'servicio_gratis', label: 'Servicio gratis' },
  { value: 'regalo', label: 'Regalo' },
  { value: 'cupon', label: 'Cupón' },
  { value: 'vip', label: 'Beneficio VIP' },
  { value: 'temporada', label: 'Por temporada' },
  { value: 'general', label: 'General' },
] as const

export type PromoTipo = (typeof PROMO_TIPOS)[number]['value']

export const PROMO_TIPO_LABEL: Record<string, string> = Object.fromEntries(
  PROMO_TIPOS.map((t) => [t.value, t.label])
)

export function esTipoValido(tipo: string): tipo is PromoTipo {
  return PROMO_TIPOS.some((t) => t.value === tipo)
}

/** Tipos cuyo campo `descuento` se interpreta como porcentaje. */
export const TIPOS_CON_PORCENTAJE = ['descuento', 'happy_hour', 'temporada']
/** Tipos cuyo campo `descuento` se interpreta como monto fijo (RD$). */
export const TIPOS_CON_MONTO = ['monto_fijo']

export const PROMO_VISIBILIDADES = [
  { value: 'publica', label: 'Pública — visible para todo MembeGo' },
  { value: 'privada', label: 'Privada — solo miembros de tu empresa' },
] as const

export type PromoVisibilidad = (typeof PROMO_VISIBILIDADES)[number]['value']

export function esVisibilidadValida(v: string): v is PromoVisibilidad {
  return PROMO_VISIBILIDADES.some((x) => x.value === v)
}
