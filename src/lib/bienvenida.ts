/**
 * Beneficio de bienvenida por empresa (Onboarding O-13).
 *
 * La EMPRESA decide si ofrece un descuento a clientes nuevos y lo financia
 * ella (Decisión de producto 3 del plan de onboarding, resuelta como cupón
 * por empresa). Se aplica UNA sola vez: en la primera activación de membresía
 * del cliente en esa empresa. El importe se congela en la membresía al
 * solicitar el plan (`descuentoBienvenida`), así un cambio posterior de la
 * configuración no altera solicitudes en curso.
 *
 * Helper puro (sin dependencias de servidor): se usa igual en server actions
 * y en componentes de cliente para previsualizar el precio.
 */

export interface BienvenidaConfig {
  bienvenidaActiva: boolean
  bienvenidaTipo: string
  /** Decimal de Prisma o number; null = sin configurar. */
  bienvenidaValor: unknown | null
}

/**
 * Descuento en dinero que aplica al precio dado, o 0 si no corresponde.
 * PORCENTAJE se acota a 100%; MONTO nunca supera el precio del plan.
 */
export function calcularDescuentoBienvenida(
  config: BienvenidaConfig,
  precio: number
): number {
  if (!config.bienvenidaActiva || config.bienvenidaValor == null) return 0
  const valor = Number(config.bienvenidaValor)
  if (!Number.isFinite(valor) || valor <= 0 || precio <= 0) return 0

  const bruto =
    config.bienvenidaTipo === 'MONTO'
      ? valor
      : (precio * Math.min(valor, 100)) / 100

  // A dos decimales y nunca más que el precio.
  return Math.min(Math.round(bruto * 100) / 100, precio)
}
